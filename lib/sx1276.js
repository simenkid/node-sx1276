var util = require('util'),
    EventEmitter = require('events');

var Q = require('q'),
    m = require('mraa'),
    _ = require('busyman');

var lora = require('./modem/lora'),
    fsk = require('./modem/fsk');

var CNST = require('./constants.json'),
    OPMODE = CNST.OPMODE,
    REG = CNST.REG;

var WRITE_MODE = 0x80,
    FIFO_SIZE = 256;    // v

// Our crystal oscillator frequency (32Mhz)
var FXOSC_FREQ = 32000000.0;
// Our freq stepping resolution (in Hz) if FXOSC_FREQ is 32Mhz
// (FXOSC_FREQ / 2^19) =
var FXOSC_STEP = 61.03515625;   // v

var RF_MID_BAND_THRESH = 525000000; // v
    // LoRa RSSI offsets depending on LF or HF bands
var LORA_RSSI_OFFSET_HF = -157;
var LORA_RSSI_OFFSET_LF = -164;

// // Chip Select control (active LOW)
// void csOn() 
// {
//   m_gpioCS.write(0);
// };

// void csOff() 
// {
//   m_gpioCS.write(1);
// };

// [TODO] promisify the spi.read(), spi.write()
// [TODO] promisify the cs.on(), cs.off()

var MODEM_TYPE = { lora: 0, fsk: 1 };   // v
var RADIO_EVENT = { done: 0, exec: 1, error: 2, timeout: 3 };
var RADIO_STATE = { idle: 0, receiving: 1, tranmitting: 2, cad: 3 };    // v

function Sx1276(spi, cs, reset) {

    var fskRadioSettings = {
        power: null, fdev: null, bandwidth: null, bandwidthAfc: null, datarate: null, preambleLen: null,
        fixLen: null, payloadLen: null, crcOn: null, iqInverted: null, rxContinuous: null
    };

    var loraRadioSettings = {
        power: null, bandwidth: null, datarate: null, lowDatarateOptimize: null, coderate: null, preambleLen: null,
        fixLen: null, payloadLen: null, crcOn: null, freqHopOn: null, hopPeriod: null, iqInverted: null, rxContinuous: null
    };

    var fskRadioPacketHandlerState = {
        preambleDetected: null, syncWordDetected: null, rssiValue: null, afcValue: null, rxGain: null,
        size: null, nbBytes: null, fifoThresh: null, chunkSize: null
    };

    var loraRadioPacketHandlerState = {
        snrValue: null, rssiValue: null, size: null
    };

    this._prevOpMode = OPMODE.Standby;  // v at init

    this.modem = lora(this);
    this.modemType = 0;  // v
    this.radioState = 0;    // v
    this.channel = 0;   // v
    this.radioSettings = {};        // fskRadioSettings || loraRadioSettings
    this.packetHandlerState = {};   // fskRadioPacketHandlerState || loraRadioPacketHandlerState
    this.radioEvent = RADIO_EVENT.done;

    this.chipRevision = 0x12;
    this.FIFO_SIZE = 256;
    // differentiator between high and low bands
    this.RF_MID_BAND_THRESH = 525000000;

    // LoRa RSSI offsets depending on LF or HF bands
    this.LOR_RSSI_OFFSET_HF = -157;
    this.LOR_RSSI_OFFSET_LF = -164;

    this.onPacketSentISR = null;
    this.onrFifoLevelISR = null;
    this.onFifoFullISR = null;
    this.onFifoEmptyISR = null;
    this.onLowBatISR = null;
    this.onModeReadyISR = null;
};

Sx1276.prototype.readReg = function (address, callback) {
    // number
    // read a register
    // return number
    validateRegAddress(address);

    var _spi = this._spi,
        _cs = this._cs,
        outPkt = Buffer.alloc(2);

    outPkt[0] = (address &= 0x7f); // msb: 1(write), 0(read)
    outPkt[1] = 0x00;              // dummy data when reading

    _cs.on().then(function () {
        return _spi.write(outPkt);
    }).then(function (inPkt) {
        return _cs.off().then(function () {
            return inPkt[1];    // number
        });
    }).nodeify(callback);
};

Sx1276.prototype.writeReg = function (reg, val, callback) {
    // number, number
    // write to a register
    // return boolean
    validateRegAddress(address);
    validateRegValue(val);

    var _spi = this._spi,
        WRITE_MODE = 0x80,
        outPkt = Buffer.alloc(2);

    outPkt[0] = (address |= WRITE_MODE);   // msb: 1(write), 0(read)

    if (_.isNumber(val))
        outPkt[1] = val;    // will be auto transformed to an integer if it is a float number
    else if (_.isBuffer(val))
        outPkt[1] = val.readUInt8(0);

    _cs.on().then(function () {
        return _spi.write(outPkt);
    }).then(function (inPkt) {
        return _cs.off().then(function () {
            return true;
        });
    }).fail(function () {
        return false;
    }).nodeify(callback);
};

// ok
Sx1276.prototype.getChipVersion = function (callback) { // return the chip revision (usually 0x12)
    // return number
    return this.readReg(REG.VERSION).nodeify(callback);
};

Sx1276.prototype.reset = function (callback) {
    //  
    // reset the modem
    //

    // void SX1276::reset()
    // {
    //   m_gpioReset.dir(mraa::DIR_OUT);
    //   usleep(1000); // 1ms
    //   m_gpioReset.dir(mraa::DIR_IN);
    //   usleep(10000); // 10ms
    // }
}


Sx1276.prototype.readFifo = function (buffer, len) {
    // uint8_t *, number
    // read the FIFO into a buffer
    // 
    if (len > FIFO_SIZE)
        throw new Error('Cannot read more than 256 bytes from FIFO');

    var outPkt = Buffer.alloc(1);


    // void SX1276::readFifo(uint8_t *buffer, int len)
    // {
    //   uint8_t pkt = 0;

    //   csOn();
    //   if (m_spi.transfer(&pkt, NULL, 1))
    //     {
    //       csOff();
    //       throw std::runtime_error(string(__FUNCTION__) +
    //                                ": Spi.transfer(0) failed");
    //       return;
    //     }

    //   if (m_spi.transfer(NULL, buffer, len))
    //     {
    //       csOff();
    //       throw std::runtime_error(string(__FUNCTION__) +
    //                                ": Spi.transfer(buf) failed");
    //       return;
    //     }
    //   csOff();
    // }

};

Sx1276.prototype.writeFifo = function (buffer, len) {
    // uint8_t *, number
    // write a buffer into the FIFO
    // 
// void SX1276::writeFifo(uint8_t *buffer, int len)
// {
//   // can't write more than 256 bytes
//   if (len > FIFO_SIZE)
//     {
//       throw std::length_error(string(__FUNCTION__) +
//                               ": cannot write more than 256 bytes to FIFO");
//       return;
//     }

//   uint8_t pkt = (0 | m_writeMode);

//   csOn();
//   if (m_spi.transfer(&pkt, NULL, 1))
//     {
//       csOff();
//       throw std::runtime_error(string(__FUNCTION__) +
//                                ": Spi.transfer(0) failed");
//       return;
//     }

//   if (m_spi.transfer(buffer, NULL, len))
//     {
//       csOff();
//       throw std::runtime_error(string(__FUNCTION__) +
//                                ": Spi.transfer(buf) failed");
//       return;
//     }
//   csOff();
// }

};

// ok
Sx1276.prototype.setChannel = function (freq, callback) {   // Set the frequency to transmit and receive on
    var self = this,
        freqMSB = ((freq >> 16) & 0xff),
        freqMID = ((freq >> 8) & 0xff),
        freqLSB = (freq & 0xff);

    freq = (freq/FXOSC_STEP);

    return this.writeReg(REG.FrfMsb, freqMSB).then(function () {
        return self.writeReg(REG.FrfMid, freqMID);
    }).then(function () {
        return self.writeReg(REG.FrfLsb, freqLSB);
    }).then(function () {
        self.channel = freq;
        return freq;
    }).nodeify(callback);
};

// ok
Sx1276.prototype.setOpMode = function (opMode, callback) {  // Set the operating mode
    var self = this;

    if (this._prevOpMode !== opMode)
        this._prevOpMode = opMode;

    this.readReg(REG.OpMode).then(function (currentBits) {
        return (currentBits & ~(_OPMODE_Mode_MASK << _OPMODE_Mode_SHIFT));   // TODO: _OPMODE_Mode_MASK, _OPMODE_Mode_SHIFT
    }).then(function (otherBits) {
        // otherBits = { modulation, freqMode }, opMode is the last 3 bits
        var newRegVal = otherBits | (opMode << _OPMODE_Mode_SHIFT);
        return self.write(REG.OpMode, newRegVal);
    }).nodeify(callback);
};

// ok
Sx1276.prototype.setModem = function (modemType, callback) {    // Set the modem to access. This can be either the LORA or KSK/OOK modem.
    var self = this,
        deferred = Q.defer();

    if (this.modemType === modemType) {
        deferred.resolve();
        return deferred.promise.nodeify(callback);
    }

    if (modemType === MODEM_TYPE.fsk) {
        this.modem = lora(this);
        // this.setOpMode(OPMODE.Sleep).then(function () {
        //     return self.readReg(REG.OpMode);
        // }).then(function (currentBits) {
        //     return currentBits & ~OPMODE_LongRangeMode; // turn off lora
        // }).then(function (newBits) {
        //     return self.writeReg(REG.OpMode, newBits);
        // }).then(function () {
        //     return self.writeReg(REG.DioMapping1, 0x00);
        // }).then(function () {
        //     return self.writeReg(REG.DioMapping2, 0x30);    // DIO5=ModeReady
        // }).then(function () {
        //     self.modemType = modemType;
        // }).done(deferred.resolve, deferred.reject);

    } else if (modemType === MODEM_TYPE.lora) {
        this.modem = fsk(this);
        // this.setOpMode(OPMODE.Sleep).then(function () {
        //     return self.readReg(REG.OpMode);
        // }).then(function (currentBits) {
        //     return currentBits | OPMODE_LongRangeMode; // turn lora on
        // }).then(function (newBits) {
        //     return self.writeReg(REG.OpMode, newBits);
        // }).then(function () {
        //     return self.writeReg(REG.DioMapping1, 0x00);
        // }).then(function () {
        //     return self.writeReg(REG.DioMapping2, 0x00);
        // }).then(function () {
        //     self.modemType = modemType;
        // }).done(deferred.resolve, deferred.reject);
    } else {
        deferred.reject('Bad modem type');
    }

    this.modem.enable().done(deferred.resolve, deferred.reject);

    return deferred.promise.nodeify(callback);
};

// ok
Sx1276.prototype.setSleep = function (callback) {   // Place the SX1276 into sleep mode
    var self = this;

    return this.setOpMode(OPMODE.Sleep).then(function () {
        self.radioState = RADIO_STATE.idle;
    }).nodeify(callback);
};

// ok
Sx1276.prototype.setStandby = function (callback) { // Place the SX1276 into standby mode
    var self = this;

    return this.setOpMode(OPMODE.Standby).then(function () {
        self.radioState = RADIO_STATE.idle;
    }).nodeify(callback);
};

// ok
Sx1276.prototype.getRSSI = function (modemType, callback) { // Return the current Received Signal Strength Indicator for the given modem
    var self = this,
        deferred = Q.defer();

    if (modemType !== MODEM_TYPE.fsk && modemType !== MODEM_TYPE.lora)
        deferred.resolve(-1);
    else
        this.modem.readRssi().done(deferred.resolve, deferred.reject);
    // if (modemType == MODEM_TYPE.fsk) {          // divide by 2

    //     return this.readReg(REG_FSK.RssiValue).then(function (rssix2) {
    //         return rssix2/2;
    //     }).done(deferred.resolve, deferred.reject);

    // } else if (modemType == MODEM_TYPE.lora) {

    //     return this.readReg(REG_LORA.RssiValue).done(function (rssiOffset) {

    //         if (self.channel > RF_MID_BAND_THRESH)
    //             rssi = LORA_RSSI_OFFSET_HF + rssiOffset;
    //         else
    //             rssi = LORA_RSSI_OFFSET_LF + rssiOffset;

    //         return rssi;
    //     }).done(deferred.resolve, deferred.reject);

    // } else {
    //     deferred.resolve(-1);
    // }

    return deferred.promise.nodeify(callback);
};

// ok
Sx1276.prototype.isChannelFree = function (modemType, freq, rssiThresh, callback) {   // Check to see if a given channel is free by comparing the RSSI to the supplied threshold.
    var self = this;

    this.setModem(modemType).then(function () {
        return self.setChannel(freq);
    }).then(function () {
        return self.setOpMode(OPMODE.FSK_RxMode);
    }).then(function () {
        return self.getRSSI(modemType);
    }).then(function (rssi) {
        return self.setSleep().then(function () {
            return rssi;
        });
    }).then(function (rssi) {
        return (rssi < rssiThresh);
    });
};

// ok
Sx1276.prototype.sendStr = function (buffer, timeout, callback) {
    // String, Number(ms)
    // Send the supplied string. This writes the string into the FIFO and places the modem in transmit mode (via setTx()). This is a wrapper around send().
    // RADIO_EVENT_T
    var deferred = Q.defer();

    if (buffer.length > (FIFO_SIZE - 1))
        deferred.reject(new Error('Buffer length must be less than 256 bytes'));

    // for LORA/FSK modem, there seems to be a 64 byte requirement, (LOR_RegRxNbBytes on the receiver) never seems to be anything
    // other than 64. Same seems to go for the FSK modem.  So, if the packet is less than 64, pad it out to 64 bytes.  This requires investigation.

    if (buffer.length < 64) {
        // padding to 64 bytes with 0s
    }

    this.send(buffer, timeout).done(deferred.resolve, deferred.reject);

    return deferred.promise.nodeify(callback);
};

Sx1276.prototype.send = function (buffer, size, timeout, callback) {
    // Uint8_t *, Number, Number(ms)
    // Send the supplied buffer. The writes the buffer into the FIFO and places the modem in transmit mode (via setTx()).
    // RADIO_EVENT_T

    return this.modem.send(buffer, size, timeout).nodeify(callback);

// SX1276::RADIO_EVENT_T SX1276::send(uint8_t *buffer, uint8_t size, 
//                                    int txTimeout)
// {
//   switch (m_settings.modem)
//     {
//     case MODEM_FSK:
//       {
//         m_settings.fskPacketHandler.NbBytes = 0;
//         m_settings.fskPacketHandler.Size = size;

//         if (m_settings.fskSettings.FixLen == false)
//           {
//             writeFifo((uint8_t *)&size, 1);
//           }
//         else
//           {
//             writeReg(FSK_RegPayloadLength, size );
//           }

//         if ( (size > 0) && (size <= 64) )
//           {
//             m_settings.fskPacketHandler.ChunkSize = size;
//           }
//         else
//           {
//             m_settings.fskPacketHandler.ChunkSize = 32;
//           }

//         // Write payload buffer
//         writeFifo(buffer, m_settings.fskPacketHandler.ChunkSize);
//         m_settings.fskPacketHandler.NbBytes += 
//           m_settings.fskPacketHandler.ChunkSize;
//       }

//       break;

//     case MODEM_LORA:
//       {
//         if (m_settings.loraSettings.IqInverted == true)
//           {
//             uint8_t reg = readReg(LOR_RegInvertIQ);

//             reg &= ~(INVERTIQ_InvertIQTxOff | INVERTIQ_InvertIQRx);
//             writeReg(LOR_RegInvertIQ, reg);

//             // warning, hardcoded undocumented magic number into
//             // undocumented register
//             writeReg(LOR_RegInvertIQ2, 0x19);
//           }
//         else
//           {
//             uint8_t reg = readReg(LOR_RegInvertIQ);
//             reg &= ~(INVERTIQ_InvertIQTxOff | INVERTIQ_InvertIQRx);
//             reg |= INVERTIQ_InvertIQTxOff; // 'active' off.
//             writeReg(LOR_RegInvertIQ, reg);

//             // warning, hardcoded undocumented magic number into
//             // undocumented register
//             writeReg(LOR_RegInvertIQ2, 0x1d);
//           }

//         m_settings.loraPacketHandler.Size = size;
//         //        cerr << "PAYLOAD SIZE " << (int)size << endl;

//         // Initializes the payload size
//         writeReg(LOR_RegPayloadLength, size);

//         // Full buffer used for Tx
//         writeReg(LOR_RegFifoTxBaseAddr, 0);
//         writeReg(LOR_RegFifoAddrPtr, 0 );

//         // FIFO operations can not take place in Sleep mode
//         if ((readReg(COM_RegOpMode) & _OPMODE_Mode_MASK) == MODE_Sleep)
//           {
//             setStandby();
//             usleep(1000); // 1ms
//           }

//         // Write payload buffer
//         writeFifo(buffer, size);
//       }

//       break;
//     }

//   return setTx(txTimeout);
// }

};

Sx1276.prototype.setTx = function (timeout, callback) {
    var self = this;

    return this.modem.setTx();

    if (this.modemType === MODEM_TYPE.fsk) {

        // DIO0=PacketSent, DIO1=FifoLevel, DIO2=FifoFull, DIO3=FifoEmpty, DIO4=LowBat, DIO5=ModeReady
        return this.readReg(REG.DioMapping1).then(function (reg) {
            reg &= ~( (DOIMAPPING1_Dio0Mapping_MASK << DOIMAPPING1_Dio0Mapping_SHIFT) | (DOIMAPPING1_Dio2Mapping_MASK <<  DOIMAPPING1_Dio2Mapping_SHIFT) );
            return self.writeReg(REG.DioMapping1, reg);
        }).then(function () {
            return readReg(REG.DioMapping2).then(function (reg) {
                reg &= ~( (DOIMAPPING2_Dio4Mapping_MASK << DOIMAPPING2_Dio4Mapping_SHIFT) | (DOIMAPPING2_Dio5Mapping_MASK << DOIMAPPING2_Dio5Mapping_SHIFT) );
                return self.writeReg(REG.DioMapping2, reg);
            });
        }).then(function () {
            
            return self.readReg(REG_FSK.FifoThresh);
        }).then(function (reg) {
            self.packetHandlerState.fifoThresh = reg & (_FIFOTHRESH_FifoThreshold_MASK << _FIFOTHRESH_FifoThreshold_SHIFT);
        }).then(gotoTransmittingState);

    } else if (this.modemType === MODEM_TYPE.lora) {

        if (this.radioSettings.freqHopOn) {
            // mask out all except TxDone and FhssChangeChannel
            var reg = LOR_IRQFLAG_RxTimeout | LOR_IRQFLAG_RxDone | LOR_IRQFLAG_PayloadCrcError | LOR_IRQFLAG_ValidHeader |
                     // LOR_IRQFLAG_TxDone |
                     LOR_IRQFLAG_CadDone |
                     // LOR_IRQFLAG_FhssChangeChannel |
                     LOR_IRQFLAG_CadDetected;

            return this.writeReg(REG_LORA.IrqFlagsMask, reg).then(function () {
                // DIO0=TxDone, DIO2=FhssChangeChannel
                return self.readReg(REG.DioMapping1);
            }).then(function (reg) {
                reg &= ~( (DOIMAPPING1_Dio0Mapping_MASK << DOIMAPPING1_Dio0Mapping_SHIFT) | (DOIMAPPING1_Dio2Mapping_MASK <<  DOIMAPPING1_Dio2Mapping_SHIFT) );
                reg |= ( (DIOMAPPING_01 << DOIMAPPING1_Dio0Mapping_SHIFT) | (DIOMAPPING_00 << DOIMAPPING1_Dio2Mapping_SHIFT) );

                return self.writeReg(REG.DioMapping1, reg);
            }).then(gotoTransmittingState);
        } else {
            // mask out all except TxDone
            var reg = LOR_IRQFLAG_RxTimeout | LOR_IRQFLAG_RxDone | LOR_IRQFLAG_PayloadCrcError | LOR_IRQFLAG_ValidHeader |
                     // LOR_IRQFLAG_TxDone |
                     LOR_IRQFLAG_CadDone | LOR_IRQFLAG_FhssChangeChannel | LOR_IRQFLAG_CadDetected;

            return this.writeReg(REG_LORA.IrqFlagsMask, reg).then(function () {
                // DIO0=TxDone
                return self.readReg(REG.DioMapping1);
            }).then(function (reg) {
                reg &= ~( (DOIMAPPING1_Dio0Mapping_MASK << DOIMAPPING1_Dio0Mapping_SHIFT) );
                reg |= (DIOMAPPING_01 << DOIMAPPING1_Dio0Mapping_SHIFT);
                return self.writeReg(REG.DioMapping1, reg);
            }).then(gotoTransmittingState);
        }


    }

    function gotoTransmittingState() {
        self.radioState = RADIO_STATE.tranmitting;
        self.radioEvent = RADIO_EVENT.exec;

        return self.setOpMode(OPMODE.TxMode);
    }




    // [TODO]

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


Sx1276.prototype.setRxConfig = function (modem, bandwidth, datarate, coderate, bandwidthAfc, preambleLen, symbTimeout, fixLen, payloadLen, crcOn, freqHopOn, hopPeriod, iqInverted, rxContinuous) {
    // modem: RADIO_MODEM_T
    // bandwidth: Number, The bandwidth to use. Valid values are FSK : >= 2600 and <= 250000 Hz LoRa: [125 kHz, 250 kHz, 500 kHz]
    // datarate: Number, Sets the Datarate FSK : 600..300000 bits/s LoRa: [6: 64, 7: 128, 8: 256, 9: 512, 10: 1024, 11: 2048, 12: 4096 chips]
    // coderate: Number, Sets the coding rate (LoRa only) FSK : N/A ( set to 0 ) LoRa: [1: 4/5, 2: 4/6, 3: 4/7, 4: 4/8]
    // bandwidthAfc: Number, Sets the AFC Bandwidth (FSK only) FSK : >= 2600 and <= 250000 Hz LoRa: N/A ( set to 0 )
    // preambleLen: Number, Sets the Preamble length FSK : Number of bytes LoRa: Length in symbols (the hardware adds 4 more symbols)
    // symbTimeout: Number, Sets the RxSingle timeout value (LoRa only) FSK : N/A ( set to 0 ) LoRa: timeout in symbols
    // fixLen: Boolean, Fixed length packets [false: variable, true: fixed]
    // payloadLen: Number, Sets payload length when fixed length is used
    // crcOn: Boolean, Enables/Disables the CRC [false: OFF, true: ON]
    // freqHopOn: Boolean, undefined
    // hopPeriod: Number, undefined
    // iqInverted: Boolean, Inverts IQ signals (LoRa only) FSK : N/A ( set to 0 ) LoRa: [false: not inverted, true: inverted]
    // rxContinuous: Boolean, Sets the reception in continuous mode [false: single mode, true: continuous mode]

    // Set the receive configuration for a modem. It is important that both the receive and transmit configurations match in order for communication to work between two radios.
};

Sx1276.prototype.setTxConfig = function (modem, power, fdev, bandwidth, datarate, coderate, preambleLen, fixLen, crcOn, freqHopOn, hopPeriod, iqInverted) {
    // modem: RADIO_MODEM_T
    // power: Number, Sets the output power [dBm]
    // fdev: Number, Sets the frequency deviation (FSK only) FSK : [Hz] LoRa: 0
    // bandwidth: Number, Sets the bandwidth (LoRa only) FSK : 0 LoRa: [125 kHz, 250 kHz, or 500 kHz]
    // datarate: Number, Sets the Datarate FSK : 600..300000 bits/s LoRa: [6: 64, 7: 128, 8: 256, 9: 512, 10: 1024, 11: 2048, 12: 4096 chips]
    // coderate: Number, Sets the coding rate (LoRa only) FSK : N/A ( set to 0 ) LoRa: [1: 4/5, 2: 4/6, 3: 4/7, 4: 4/8]
    // preambleLen: Number, Sets the preamble length FSK : Number of bytes LoRa: Length in symbols (the hardware adds 4 more symbols)
    // fixLen: Boolean, Fixed length packets [false: variable, true: fixed]
    // crcOn: Boolean, Enables disables the CRC [false: OFF, true: ON]
    // freqHopOn: Boolean, undefined
    // hopPeriod: Number, undefined
    // iqInverted: Boolean, Inverts IQ signals (LoRa only) FSK : N/A ( set to 0 ) LoRa: [false: not inverted, true: inverted]

    // Set the transmit configuration for a modem. It is important that both the receive and transmit configurations match in order for communication to work between two radios.
};

Sx1276.prototype.setRx = function (timeout) {
    // Number, The timeout in milliseconds
    // Start a receive operation. The method will return when completed, either successfully, or in error (crc, or other issue). If completed successfully, the returned buffer can be read via getRxBuffer() or getRxBufferStr() . In addition, values for RSSI and SNR (Lora only) can be retrieved.
    // RADIO_EVENT_T
};

Sx1276.prototype.getRxBufferStr = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet.
    // String: The received buffer in a std::string
};

Sx1276.prototype.getRxBuffer = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet.
    // Uint8_t *: a pointer to the received buffer. You can use getRxLen() to determine the number of valid bytes present.
    return (uint8_t*)m_rxBuffer;
};

Sx1276.prototype.getRxRSSI = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet's Received Signal Strength Indicator (RSSI) value.
    // Number: RSSI value
    return m_rxRSSI;
};

Sx1276.prototype.getRxSNR = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet's Signal to Noise (SNR) value.
    // Number: SNR value
    return m_rxSNR;
};

Sx1276.prototype.getRxLen = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the number of bytes received.
    // Number: the number of bytes received
};


function validateRegAddress(address) {
    if (!_.isNumber(address))
        throw new TypeError('address should be a number.');
    else if (address < 0 || address > 255)
        throw new RangeError('address should be an integer in between 0 and 255.');
}

function validateRegValue(val) {
    if (_.isNumber(val)) {
        if (val > 255 || val < 0)
            throw new RangeError('val should be in between 0 to 255 if it is a number.');
    } else if (_.isBuffer(val)) {
        if (val.length !== 1)
            throw new Error('val should be a single byte to write out.');
    } else {
        throw new TypeError('data must be a number or a buffer');
    }
}

// private
this._lookupFSKBandWidth = function () {};


    // received data (on successful completion)
    volatile int m_rxRSSI;
    volatile int m_rxSNR;
    volatile int m_rxLen;
    uint8_t m_rxBuffer[FIFO_SIZE];

    // for coordinating interrupt access
    pthread_mutex_t m_intrLock;

    void lockIntrs() { pthread_mutex_lock(&m_intrLock); };
    void unlockIntrs() { pthread_mutex_unlock(&m_intrLock); };

    // timer support
    struct timeval m_startTime;
    void initClock();
    uint32_t getMillis();