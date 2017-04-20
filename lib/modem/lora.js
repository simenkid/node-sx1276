var CONST = require('../constants/constants');

var FXOSC_STEP = CONST.FXOSC_STEP;
var OPMODE = CONST.OPMODE;
var RADIO_STATE = CONST.RADIO_STATE;
var RF_MID_BAND_THRESH = CONST.RF_MID_BAND_THRESH;
var LORA_RSSI_OFFSET_HF = CONST.LORA_RSSI_OFFSET_HF;
var LORA_RSSI_OFFSET_LF = CONST.LORA_RSSI_OFFSET_HF;
var DIO_MAPPING = CONST.DIO_MAPPING;

var lora = {
    chip: null,
    settings: {
        power: null,
        bandwidth: null,
        datarate: null,
        lowDatarateOptimize: null,
        coderate: null,
        preambleLen: null,
        fixLen: null,
        payloadLen: null,
        crcOn: null,
        freqHopOn: null,
        hopPeriod: null,
        iqInverted: null,
        rxContinuous: null
    },
    packetState: {
        snrValue: null,
        rssiValue: null,
        size: null
    }

};

// ok
lora.enable = function (callback) {
    var self = this,
        chip = this.chip;

    return chip.setOpMode(OPMODE.Sleep).then(function () {
        return chip.write('COM.OpMode', { longRangeMode: 1 });  // turn lora on
    }).then(function () {
        return chip.write('COM.DioMapping1', 0x00);
    }).then(function () {
        return chip.write('COM.DioMapping2', 0x00);
    }).nodeify(callback);
};

// ok
lora.readRssi = function (callback) {
    var chip = this.chip;

    return chip.readReg('LORA.RssiValue').then(function (val) {
        var rssi = (chip.channel > RF_MID_BAND_THRESH) ? LORA_RSSI_OFFSET_HF + val : LORA_RSSI_OFFSET_LF + val;
        return rssi;
    }).nodeify(callback);
};

// ok
lora.startCad = function (callback) {
    var chip = this.chip;

    // mask out all except CadDone and CadDetected
    return chip.write('LORA.IrqFlagsMask', {
        rxTimeout: 1,
        rxDone: 1,
        payloadCrcError: 1,
        validHeader: 1,
        txDone: 1,
        cadDone: 0,
        fhssChangeChannel: 1,
        cadDetected: 0
    }).then(function () {
        // DIO3=CADDone
        return chip.write('COM.DioMapping1', { dio3Mapping: 0 });
    }).then(function () {
        chip.state.radio = TODO_STATE_CAD;
        return chip.setOpMode(TODO_MODE_CAD);
    }).nodeify(callback);
};

lora.configTx = function (config, callback) {
    var deferred = Q.defer(),
        chip = this.chip,
        settings = this.settings,
        fdevDigits = Math.round(config.fdev / TODO_FXOSC_STEP),
        datarateDigits = Math.round(TODO_FXOSC_FREQ / config.datarate);

    settings.power = config.power;

    switch (config.bandwidth) {
        case 125000:
            settings.bandwidth = config.bandwidth = TODO_BW_125;
            break;

        case 250000:
            settings.bandwidth = config.bandwidth = TODO_BW_250;
            break;

        case 500000:
            settings.bandwidth = config.bandwidth = TODO_BW_500;
            break;

        default:
            deferred.reject(new Error('LORA bandwidth must be 125000, 250000, or 500000'));
            return deferred.promise.nodeify(callback);
    }

    settings.datarate = config.datarate;
    settings.coderate = config.coderate;
    settings.preambleLen = config.preambleLen;
    settings.fixLen = config.fixLen;
    settings.freqHopOn = config.freqHopOn;
    settings.hopPeriod = config.hopPeriod;
    settings.crcOn = config.crcOn;
    settings.iqInverted = config.iqInverted;

    // not set here: lowDatarateOptimize, payloadLen, rxContinuous

    // datarate is really SPREADINGFACTOR_* for LoRa
    config.datarate = (config.datarate < 6) ? 6 : config.datarate;
    config.datarate = (config.datarate > 12) ? 12 : config.datarate;

    if (config.bandwidth === TODO_BW_125)
        settings.lowDatarateOptimize = ((config.datarate === 11) || (config.datarate === 12)) ? true : false;
    else if (config.bandwidth === TODO_BW_250)
        settings.lowDatarateOptimize = (config.datarate === 12) ? true : false;
    else
        settings.lowDatarateOptimize = false;


    // datasheet says this is only valid in FSK mode, but Semtech
    // code indicates it is only available in LORA mode... So
    // which is it?
    
    // Lets assume for now that the code is correct, as there
    // is a HopPeriod register for LoRa, and no such registers
    // exist for FSK.

    chip.write('LORA.PllHop', {
        fastHopOn: settings.freqHopOn ? 1 : 0,
        reserved: 0
    }).then(function () {
        if (settings.hopPeriod)
            return chip.writeReg('LORA.HopPeriod', settings.hopPeriod);
        else
            return null;
    }).then(function () {
        return chip.write('LORA.ModemConfig1', {
            bw: settings.bandwidth,
            codingRate: settings.coderate,
            implicitHeaderModeOn: settings.fixLen ? 1 : 0
        });
    }).then(function () {
        return chip.write('LORA.ModemConfig2', {
            spreadingFactor: settings.datarate,
           // txContinuousMode: ,   - not set
            rxPayloadCrcOn: settings.crcOn ? 1 : 0,
           // symbTimeout:          - not set
        });
    }).then(function () {
        return chip.write('LORA.ModemConfig3', {
            // unused: ,            - not set
            lowDataRateOptimize: settings.lowDatarateOptimize,
            // agcAutoOn: ,         - not set
            // reserved: ,          - not set
        });
    }).then(function () {
        return chip.writeReg('LORA.PreambleMsb', ((settings.preambleLen >> 8) & 0xFF));
    }).then(function () {
        return chip.writeReg('LORA.PreambleLsb', (settings.preambleLen & 0xFF));
    }).then(function () {
        // datarate is SPREADINGFACTOR_*
        var detOpt = (settings.datarate === 6) ? TODO_DETECTIONOPTIMIZE_SF6 : TODO_DETECTIONOPTIMIZE_SF7_SF12;

        return chip.write('LORA.DetectOptimize', { detectionOptimize: detOpt });
    }).then(function () {
        var threshold = (settings.datarate === 6) ? TODO_LOR_DetectionThreshold_SF6 : TODO_LOR_DetectionThreshold_SF7_SF12;
        // see page 27 in the datasheet
        return chip.writeReg('LORA.DetectionThreshold', threshold);
    }).done(deferred.resolve, deferred.reject);


    return deferred.promise.nodeify(callback);
};
//--------

lora.use = function () {
    var self = this;
    this.setOpMode(OPMODE.Sleep).then(function () {
            return self.readReg(REG.OpMode);
    }).then(function (currentBits) {
        return currentBits & ~OPMODE_LongRangeMode; // turn off lora
    }).then(function (newBits) {
        return self.writeReg(REG.OpMode, newBits);
    }).then(function () {
        return self.writeReg(REG.DioMapping1, 0x00);
    }).then(function () {
        return self.writeReg(REG.DioMapping2, 0x30);    // DIO5=ModeReady
    }).then(function () {
        self.modemType = modemType;
    }).done(deferred.resolve, deferred.reject);
};

lora.readRssi = function () {
    return this.readReg(REG_LORA.RssiValue).done(function (rssiOffset) {

        if (self.channel > RF_MID_BAND_THRESH)
            rssi = LORA_RSSI_OFFSET_HF + rssiOffset;
        else
            rssi = LORA_RSSI_OFFSET_LF + rssiOffset;

        return rssi;
    }).done(deferred.resolve, deferred.reject);
};

// [TODO] need refactor
lora.send = function (buf, timeout, callback) {
    var self = this,
        deferred = Q.defer(),
        chip = this.chip,
        writePayload,
        size;

    if (_.isString(buf))
        buf = Buffer.from(buf, 'utf8');

    if (!_.isBuffer(buf)) {
        deferred.reject(new TypeError('Data to send must be a string or a buffer'));
        return deferred.promise.nodeify(callback);
    }

    size = buf.length;

    if (this.settings.iqInverted) {
        var INVERTIQ_InvertIQTxOff = 0x01;  // invert LoRa I & Q signals, UNDOCUMENTED
        var INVERTIQ_InvertIQRx = 0x40;     // invert LoRa I & Q signals

        // [TODO] undocument thing
        chip.write('LORA.InvertIQ', {
            invertIQ: INVERTIQ_InvertIQTxOff | INVERTIQ_InvertIQRx // [X] TODO, clear, not set to it
        }).then(function () {
            // warning, hardcoded undocumented magic number into
            // undocumented register
            return chip.writeReg('LORA.InvertIQ2', 0x19);
        });
    } else {
        // [TODO] undocument thing
        chip.write('LORA.InvertIQ', {
            invertIQ: INVERTIQ_InvertIQTxOff // [X] TODO, 'active' off.
        }).then(function () {
            // warning, hardcoded undocumented magic number into
            // undocumented register
            return chip.writeReg('LORA.InvertIQ2', 0x1d);
        });
    }

    this.settings.packetState.size = size;

    chip.writeReg('LORA.PayloadLength', size).then(function () {
        // Full buffer used for Tx
        return chip.writeReg('LORA.FifoTxBaseAddr', 0);
    }).then(function () {
        return chip.writeReg('LORA.FifoAddrPtr', 0);
    }).then(function () {
        return chip.read('COM.OpMode');
    }).then(function (data) {
        // FIFO operations can not take place in Sleep mode
        if (data.mode === OPMODE.Sleep) {
            return chip.standby().delay(1);    // 1ms
        }
    }).then(function () {
        // Write payload buffer
        return chip.witeFifo(buf);
    }).then(function () {
        return self.runTx();
    });

    return deferred.promise.nodeify(callback);
};


lora.runTx = function (timeout, callback) {
    // DIO0 = PacketSent, DIO1 = FifoLevel,
    // DIO2 = FifoFull, DIO3 = FifoEmpty,
    // DIO4 = LowBat, DIO5 = ModeReady

    var self = this,
        chip = this.chip,
        deferred = Q.defer(),
        isFreqHopping = this.settings.freqHopOn,
        irqMask,
        dioMap,
        txRunningChecker;

    if (isFreqHopping) {
        // mask out all except TxDone and FhssChangeChannel
        irqMask = {
            rxTimeout: 1,  rxDone: 1, payloadCrcError: 1, validHeader: 1,
            txDone: 0, cadDone: 1, fhssChangeChannel: 0, cadDetected: 1
        };

        // DIO0 = TxDone, DIO2 = FhssChangeChannel
        dioMap = { dio0Mapping: DIO_MAPPING.M01, dio2Mapping: DIO_MAPPING.M00 };
    } else {
        // mask out all except TxDone
        irqMask = {
            rxTimeout: 1, rxDone: 1, payloadCrcError: 1, validHeader: 1,
            txDone: 0, cadDone: 1, fhssChangeChannel: 1, cadDetected: 1
        };

        // DIO0 = TxDone
        dioMap = { dio0Mapping: DIO_MAPPING.M01 };
    }


    chip.write('LORA.IrqFlagsMask', irqMask).then(function () {
        return chip.write('COM.DioMapping1', dioMap);
    }).then(function () {
        chip.state.radio = RADIO_STATE.Transmitting;
        chip.state.radioEvent = RADIO_EVENT.Exec;
        return setOpMode(OPMODE.TxMode);
    }).then(function () {
        // [TODO] REPEAT CODE
        txRunningChecker = setInterval(function () {
            if (timeout === 0) {
                clearInterval(txRunningChecker);

                if (chip.state.radioEvent === RADIO_EVENT.Exec) {
                    chip.state.radioEvent === RADIO_EVENT.Timeout;
                    deferred.reject(new Error('Timeout'));
                } else {
                    deferred.resolve(true);
                }
            } else if (chip.state.radioEvent !== RADIO_EVENT.Exec) {
                clearInterval(txRunningChecker);
                deferred.resolve(true);
            } else {
                timeout -= 1;
            }
        }, 1);
    });

    return deferred.promise.nodeify(callback);
};

lora.setTx = function () {
  uint8_t reg = 0;

        if (m_settings.loraSettings.FreqHopOn == true )
          {
            // mask out all except TxDone and FhssChangeChannel
            writeReg(LOR_RegIrqFlagsMask, 
                     LOR_IRQFLAG_RxTimeout |
                     LOR_IRQFLAG_RxDone |
                     LOR_IRQFLAG_PayloadCrcError |
                     LOR_IRQFLAG_ValidHeader |
                     // LOR_IRQFLAG_TxDone |
                     LOR_IRQFLAG_CadDone |
                     // LOR_IRQFLAG_FhssChangeChannel |
                     LOR_IRQFLAG_CadDetected);
            
            // DIO0=TxDone, DIO2=FhssChangeChannel
            reg = readReg(COM_RegDioMapping1);
            reg &= ~( (DOIMAPPING1_Dio0Mapping_MASK << 
                       DOIMAPPING1_Dio0Mapping_SHIFT) |
                      (DOIMAPPING1_Dio2Mapping_MASK << 
                       DOIMAPPING1_Dio2Mapping_SHIFT) );
            reg |= ( (DIOMAPPING_01 << DOIMAPPING1_Dio0Mapping_SHIFT) |
                     (DIOMAPPING_00 << DOIMAPPING1_Dio2Mapping_SHIFT) );
            writeReg(COM_RegDioMapping1, reg);
          }
        else
          {
            // mask out all except TxDone
            writeReg(LOR_RegIrqFlagsMask, 
                     LOR_IRQFLAG_RxTimeout |
                     LOR_IRQFLAG_RxDone |
                     LOR_IRQFLAG_PayloadCrcError |
                     LOR_IRQFLAG_ValidHeader |
                     // LOR_IRQFLAG_TxDone |
                     LOR_IRQFLAG_CadDone |
                     LOR_IRQFLAG_FhssChangeChannel |
                     LOR_IRQFLAG_CadDetected);

            // DIO0=TxDone
            reg = readReg(COM_RegDioMapping1);
            reg &= ~( (DOIMAPPING1_Dio0Mapping_MASK << 
                       DOIMAPPING1_Dio0Mapping_SHIFT) );
            reg |= (DIOMAPPING_01 << DOIMAPPING1_Dio0Mapping_SHIFT);
            writeReg(COM_RegDioMapping1, reg);
          }

  m_settings.state = STATE_TX_RUNNING;
  m_radioEvent = REVENT_EXEC;

  setOpMode(MODE_TxMode);

  initClock();
  while ((getMillis() < static_cast<uint32_t>(timeout)) && m_radioEvent == REVENT_EXEC)
    usleep(100);

  if (m_radioEvent == REVENT_EXEC)
    {
      // timeout
      m_radioEvent = REVENT_TIMEOUT;
    }

  return m_radioEvent;
};

lora.setRx = function () {
  bool rxContinuous = false;
  uint8_t reg = 0;

// The datasheet does not mention anything other than an InvertIQ bit (0x40) in RegInvertIQ register (0x33).  Here,
// we seem to have two bits in RegInvertIQ (existing one for RX), and a 'new' one for TXOff (0x01).  In addition,
// INVERTIQ2 (0x3b) does not exist in the datasheet, it is marked as reserved. We will assume that the datasheet is
// out of date.

    if (m_settings.loraSettings.IqInverted == true) {
        reg = readReg(LOR_RegInvertIQ);
        reg &= ~(INVERTIQ_InvertIQTxOff | INVERTIQ_InvertIQRx);
        reg |= INVERTIQ_InvertIQRx;
        writeReg(LOR_RegInvertIQ, reg);
        // warning, hardcoded undocumented magic number into undocumented register
        writeReg(LOR_RegInvertIQ2, 0x19);
    } else {
        reg = readReg(LOR_RegInvertIQ);
        reg &= ~(INVERTIQ_InvertIQTxOff | INVERTIQ_InvertIQRx);
        reg |= INVERTIQ_InvertIQTxOff; // 'active' off.
        writeReg(LOR_RegInvertIQ, reg);

        // warning, hardcoded undocumented magic number into undocumented register
        writeReg(LOR_RegInvertIQ2, 0x1d);
    }

    var bw = [
        { reg: LOR_Reserved2f, val: 0x48, offset: 7.81e3    },  // 7.8 kHz
        { reg: LOR_Reserved2f, val: 0x44, offset: 10.42e3   },  // 10.4 kHz
        { reg: LOR_Reserved2f, val: 0x44, offset: 15.62e3   },  // 15.6 kHz
        { reg: LOR_Reserved2f, val: 0x44, offset: 20.83e3   },  // 20.8 kHz
        { reg: LOR_Reserved2f, val: 0x44, offset: 31.25e3   },  // 31.2 kHz
        { reg: LOR_Reserved2f, val: 0x44, offset: 41.67e3   },  // 41.4 kHz
        { reg: LOR_Reserved2f, val: 0x40, offset: null      },  // 62.5 kHz
        { reg: LOR_Reserved2f, val: 0x40, offset: null      },  // 125 kHz
        { reg: LOR_Reserved2f, val: 0x40, offset: null      },  // 250 kHz
    ];

    // ERRATA 2.3 - Receiver Spurious Reception of a LoRa Signal
    if (m_settings.loraSettings.Bandwidth < 9)
      {
        reg = readReg(LOR_RegDetectOptimize);
        reg &= 0x7f; // clear undocumented bit 7
        writeReg(LOR_RegDetectOptimize, reg);

        var xreg = bw[m_settings.loraSettings.Bandwidth].reg,   
            xval = bw[m_settings.loraSettings.Bandwidth].val,
            xoffset = bw[m_settings.loraSettings.Bandwidth].offset;

        // warning, writing magic numbers into undocumented registers
        writeReg(xreg, xval).then(function () {
            if (xoffset !== null)
                return self.setChannel(m_settings.channel + xoffset);
        });

      }
    else
      {
        reg = readReg(LOR_RegDetectOptimize);
        reg |= 0x80; // set undocumented bit 7
        writeReg(LOR_RegDetectOptimize, reg);
      }

    rxContinuous = m_settings.loraSettings.RxContinuous;
        
    if (m_settings.loraSettings.FreqHopOn == true)
      {
        // mask out all except RxDone, RxTimeout, PayloadCrCError,
        // and FhssChangeChannel
        writeReg(LOR_RegIrqFlagsMask, 
                 // LOR_IRQFLAG_RxTimeout |
                 // LOR_IRQFLAG_RxDone |
                 // LOR_IRQFLAG_PayloadCrcError |
                 LOR_IRQFLAG_ValidHeader |
                 LOR_IRQFLAG_TxDone |
                 LOR_IRQFLAG_CadDone |
                 // LOR_IRQFLAG_FhssChangeChannel |
                 LOR_IRQFLAG_CadDetected);

        // DIO0=RxDone, DIO2=FhssChangeChannel
        reg = readReg(COM_RegDioMapping1);
        reg &= ~( (DOIMAPPING1_Dio0Mapping_MASK << DOIMAPPING1_Dio0Mapping_SHIFT) | (DOIMAPPING1_Dio2Mapping_MASK << DOIMAPPING1_Dio2Mapping_SHIFT) );
        reg |= ( (DIOMAPPING_00 << DOIMAPPING1_Dio0Mapping_SHIFT) | (DIOMAPPING_00 << DOIMAPPING1_Dio2Mapping_SHIFT) );
        writeReg(COM_RegDioMapping1, reg);
      } else {
        // mask out all except RxDone, RxTimeout, and PayloadCrCError
        writeReg(LOR_RegIrqFlagsMask, 
                 // LOR_IRQFLAG_RxTimeout |
                 // LOR_IRQFLAG_RxDone |
                 // LOR_IRQFLAG_PayloadCrcError |
                 LOR_IRQFLAG_ValidHeader |
                 LOR_IRQFLAG_TxDone |
                 LOR_IRQFLAG_CadDone |
                 LOR_IRQFLAG_FhssChangeChannel |
                 LOR_IRQFLAG_CadDetected);

        // DIO0=RxDone
        reg = readReg(COM_RegDioMapping1);
        reg &= ~(DOIMAPPING1_Dio0Mapping_MASK << DOIMAPPING1_Dio0Mapping_SHIFT);
        reg |= (DIOMAPPING_00 << DOIMAPPING1_Dio0Mapping_SHIFT);
        writeReg(COM_RegDioMapping1, reg);
      }

    writeReg(LOR_RegFifoRxBaseAddr, 0);
    writeReg(LOR_RegFifoAddrPtr, 0);
  }


  memset(m_rxBuffer, 0, FIFO_SIZE);

  m_settings.state = STATE_RX_RUNNING;
  m_radioEvent = REVENT_EXEC;

    if (rxContinuous == true) {
        setOpMode(MODE_LOR_RxContinuous);
    } else {
        setOpMode(MODE_LOR_RxSingle);
    }

  initClock();
  while ((getMillis() < timeout) && m_radioEvent == REVENT_EXEC)
    usleep(100);

  if (m_radioEvent == REVENT_EXEC)
    {
      // timeout
      m_radioEvent = REVENT_TIMEOUT;
    }

  return m_radioEvent;
};

lora.setTxConfig = function () {

};

lora.setRxConfig = function (config) {
    // config = {
    //     bandwidth: null,    // number
    //     bandwidthAfc: null, // number
    //     datarate: null,     // number
    //     coderate: null,     // number
    //     preambleLen: null,  // number
    //     symbTimeout: null,  // number
    //     fixLen: null,       // bool
    //     payloadLen: null,   // number
    //     crcOn: null,        // bool
    //     freqHopOn: null,    // bool
    //     hopPeriod: null,    // number
    //     iqInverted: null,   // bool
    //     rxContinuous: null  // bool
    // };

        // convert the supplied (legal) LORA bandwidths into something
        // the chip can handle.
        switch (bandwidth) 
          {
          case 125000:
            bandwidth = BW_125;
            break;
            
          case 250000:
            bandwidth = BW_250;
            break;
            
          case 500000:
            bandwidth = BW_500;
            break;
            
          default:
            throw std::runtime_error(std::string(__FUNCTION__) +
                                     ": LORA bandwidth must be 125000, 250000, "
                                     "or 500000");
          }

        m_settings.loraSettings.Bandwidth = bandwidth;
        m_settings.loraSettings.Datarate = datarate;
        m_settings.loraSettings.Coderate = coderate;
        m_settings.loraSettings.FixLen = fixLen;
        m_settings.loraSettings.PayloadLen = payloadLen;
        m_settings.loraSettings.CrcOn = crcOn;
        m_settings.loraSettings.FreqHopOn = freqHopOn;
        m_settings.loraSettings.HopPeriod = hopPeriod;
        m_settings.loraSettings.IqInverted = iqInverted;
        m_settings.loraSettings.RxContinuous = rxContinuous;


        // datarate is really LORA SPREADING_FACTOR_*
        if (datarate > 12)
          {
            datarate = 12;
          }
        else if (datarate < 6)
          {
            datarate = 6;
          }

        
        if ( ((bandwidth == BW_125) && ((datarate == 11) || 
                                        (datarate == 12))) ||
             ((bandwidth == BW_250) && (datarate == 12)) )
          {
            m_settings.loraSettings.LowDatarateOptimize = true;
          }
        else
          {
            m_settings.loraSettings.LowDatarateOptimize = false;
          }


        reg = readReg(LOR_RegModemConfig1);
        reg &= ~((_MODEMCONFIG1_CodingRate_MASK << 
                  _MODEMCONFIG1_CodingRate_SHIFT) |
                 (_MODEMCONFIG1_Bw_MASK << _MODEMCONFIG1_Bw_SHIFT) |
                 MODEMCONFIG1_ImplicitHeaderModeOn);

        if (fixLen)
          reg |= MODEMCONFIG1_ImplicitHeaderModeOn;

        reg |= ((bandwidth & _MODEMCONFIG1_Bw_MASK) << _MODEMCONFIG1_Bw_SHIFT);
        reg |= ((coderate & _MODEMCONFIG1_CodingRate_MASK) << 
                _MODEMCONFIG1_CodingRate_SHIFT);

        writeReg(LOR_RegModemConfig1, reg);

        reg = readReg(LOR_RegModemConfig2);
        reg &= ~((_MODEMCONFIG2_SpreadingFactor_MASK << 
                  _MODEMCONFIG2_SpreadingFactor_SHIFT) |
                 MODEMCONFIG2_RxPayloadCrcOn |
                 (_MODEMCONFIG2_SymbTimeoutMsb_MASK <<
                  _MODEMCONFIG2_SymbTimeoutMsb_SHIFT));

        if (crcOn)
          reg |= MODEMCONFIG2_RxPayloadCrcOn;

        reg |= ((datarate & _MODEMCONFIG2_SpreadingFactor_MASK) << 
                _MODEMCONFIG2_SpreadingFactor_SHIFT);

        // mask symbTimeOut (MSB) for safety
        reg |= ( ((symbTimeout >> 8) & _MODEMCONFIG2_SymbTimeoutMsb_MASK) << 
                 _MODEMCONFIG2_SymbTimeoutMsb_SHIFT);
        writeReg(LOR_RegModemConfig2, reg);

        reg = readReg(LOR_RegModemConfig3);
        
        reg &= ~MODEMCONFIG3_LowDataRateOptimize;

        if (m_settings.loraSettings.LowDatarateOptimize)
          reg |= MODEMCONFIG3_LowDataRateOptimize;

        writeReg(LOR_RegModemConfig3, reg);

        writeReg(LOR_RegSymbTimeoutLsb, (uint8_t)(symbTimeout & 0xff));

            
        writeReg(LOR_RegPreambleMsb, (uint8_t)((preambleLen >> 8) & 0xff));
        writeReg(LOR_RegPreambleLsb, (uint8_t)(preambleLen & 0xff));

        if (fixLen == 1)
          writeReg(LOR_RegPayloadLength, payloadLen);


        // The datasheet says this is only valid in FSK mode, but
        // Semtech code indicates it is only available in LORA
        // mode... So which is it?
        
        // Lets assume for now that the code is correct, as there
        // is a HopPeriod register for LoRa, and no such registers
        // exist for FSK.
        if (m_settings.loraSettings.FreqHopOn)
          {
            reg = readReg(LOR_RegPllHop);
            reg &= ~PLLHOP_FastHopOn;
            reg |= PLLHOP_FastHopOn;
            writeReg(LOR_RegPllHop, reg);

            writeReg(LOR_RegHopPeriod, m_settings.loraSettings.HopPeriod);
          }
        else
          {
            reg = readReg(LOR_RegPllHop);
            reg &= ~PLLHOP_FastHopOn;
            writeReg(LOR_RegPllHop, reg);
          }


        // errata checks - writing magic numbers into undocumented,
        // reserved registers :) The Semtech code was broken in this
        // logic.
        if ( (bandwidth == BW_500) && 
             (m_settings.channel > RF_MID_BAND_THRESH) )
          {
            // ERRATA 2.1 - Sensitivity Optimization with a 500 kHz
            // Bandwidth (HF)
            writeReg(LOR_Reserved36, 0x02);
            writeReg(LOR_Reserved3a, 0x64);
          }
        else if (bandwidth == BW_500 && 
                 (m_settings.channel >= 410000000))
          {
            // ERRATA 2.1 - Sensitivity Optimization with a 500 kHz
            // Bandwidth (LF above 410Mhz)
            writeReg(LOR_Reserved36, 0x02);
            writeReg(LOR_Reserved3a, 0x7f);
          }
        else
          {
            // ERRATA 2.1 - Sensitivity Optimization with a 500 kHz
            // Bandwidth (everything else)
            writeReg(LOR_Reserved36, 0x03);
          }

        // datarate is really LORA spreading factor
        if (datarate == 6)
          {
            // datarate == SPREADINGFACTOR_64
            reg = readReg(LOR_RegDetectOptimize);
            reg &= ~(_DETECTOPTIMIZE_DetectionOptimize_MASK << 
                     _DETECTOPTIMIZE_DetectionOptimize_SHIFT);

            reg |= (DETECTIONOPTIMIZE_SF6 << 
                    _DETECTOPTIMIZE_DetectionOptimize_SHIFT);

            writeReg(LOR_RegDetectOptimize, reg);

            // see page 27 in the datasheet
            writeReg(LOR_RegDetectionThreshold, LOR_DetectionThreshold_SF6);
          }
        else
          {
            reg = readReg(LOR_RegDetectOptimize);
            reg &= ~(_DETECTOPTIMIZE_DetectionOptimize_MASK << 
                     _DETECTOPTIMIZE_DetectionOptimize_SHIFT);

            reg |= (DETECTIONOPTIMIZE_SF7_SF12 << 
                    _DETECTOPTIMIZE_DetectionOptimize_SHIFT);

            writeReg(LOR_RegDetectOptimize, reg);

            // see page 27 in the datasheet
            writeReg(LOR_RegDetectionThreshold, 
                     LOR_DetectionThreshold_SF7_SF12);
          }
};



lora.startCAD = function () {
    var reg = LOR_IRQFLAG_RxTimeout | LOR_IRQFLAG_RxDone | LOR_IRQFLAG_PayloadCrcError |
                 LOR_IRQFLAG_ValidHeader | LOR_IRQFLAG_TxDone |
                 // LOR_IRQFLAG_CadDone |
                 LOR_IRQFLAG_FhssChangeChannel; //|
                 // LOR_IRQFLAG_CadDetected
        // mask out all except CadDone and CadDetected
        this.writeReg(LOR_RegIrqFlagsMask, reg).then(function () {
            // DIO3=CADDone
            return self.readReg(COM_RegDioMapping1);
        }).then(function (val) {
            val &= ~(DOIMAPPING1_Dio3Mapping_MASK << DOIMAPPING1_Dio3Mapping_SHIFT);
            val |= (DIOMAPPING_00 << DOIMAPPING1_Dio3Mapping_SHIFT);
            return self.writeReg(COM_RegDioMapping1, val);
        }).then(function () {
            m_settings.state = STATE_CAD;
            return self.setOpMode(MODE_LOR_CAD);
        });
};

lora.setMaxPayloadLength = function () {
    // modemType = lora
    return this.setModem(modemType).writeReg(LORA_REG.MaxPayloadLength, max);
};