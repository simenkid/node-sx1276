var lora = {};

var radioSettings = {
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
};

var loraRadioPacketHandlerState = {
    snrValue: null,
    rssiValue: null,
    size: null
};

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

lora.send = function () {

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

lora.setRxConfig = function () {
    
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