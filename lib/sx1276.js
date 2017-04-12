// spi: mode 0, 10000000 (10 MHz)
// cs: output, csOff(), csOn()
// reset: input (high-z)
// 10ms for POR
// ISR:
//    DIO0, input, rising edge, onDio0IRQ
//    DIO1, input, rising edge, onDio1IRQ
//    DIO2, input, rising edge, onDio2IRQ
//    DIO3, input, rising edge, onDio3IRQ
//    DIO4, input, rising edge, onDio4IRQ
//    DIO5, input, rising edge, onDio5IRQ



var MODEM_TYPE = { lora: 0, fsk: 1 };   // v
var RADIO_EVENT = { done: 0, exec: 1, error: 2, timeout: 3 };
var RADIO_STATE = { idle: 0, receiving: 1, tranmitting: 2, cad: 3 };    // v


function Sx1276(spi, cs, reset) {
    this.spi = spi;
    this.cs = cs;
    this.reset = reset;
    this.chipVersion = 0;   // [TODO]

    this.channel = null;

    this._fifoSize = 256;

    this.state = {
        opMode: 0,
        radio: 0,       // idle, receiving, transmitting, cad
        radioEvent: 0   // done, exec, error, timeout
    };

    this.startTime = now();

    this.state.radioEvent = TODO_REVENT_DONE;   // RaduiEvent.Done
    this.state.radio = TODO_STATE_IDLE;         // RadioState.Idle
    this.rxBuffer = new Buffer(this._fifoSize); // new Buffer(FIFO_SIZE)
    this.rxRSSI = 0;
    this.rxSNR = 0;

//---
    this.modem = null;

    this.rxLen = null;

    this.intrLock = null;
    // void lockIntrs() { pthread_mutex_lock(&m_intrLock); };
    // void unlockIntrs() { pthread_mutex_unlock(&m_intrLock); };

    this.initClock = null;  // function
    this.getMillis = null;  // function

    this.onDio0Irq = null;
    this.onDio1Irq = null;
    this.onDio2Irq = null;
    this.onDio3Irq = null;
    this.onDio4Irq = null;
    this.onDio5Irq = null;

    // check the chip revision (to make sure we can read the regs properly)
    this.getChipVersion(function (cRev) {
        if (cRev !== chipVersion)
            self.emit('error', new Error('Incorrect Chip Revision. Expected 0x ')); // , got 0x"
    });

    this.init();
}

// [SEMI]
Sx1276.prototype.init = function (callback) {
    var self = this;
    // some initial setup
    var radioRegsInit = [
        { modemType: MODEM_FSK,  regName: 'COM.Lna',              value: 0x23 },
        { modemType: MODEM_FSK,  regName: 'FSK.RxConfig',         value: 0x1E },
        { modemType: MODEM_FSK,  regName: 'FSK.RssiConfg',        value: 0xD2 },
        { modemType: MODEM_FSK,  regName: 'FSK.PreambleDetect',   value: 0xAA },
        { modemType: MODEM_FSK,  regName: 'FSK.Osc',              value: 0x07 },
        { modemType: MODEM_FSK,  regName: 'FSK.SyncConfig',       value: 0x12 },
        { modemType: MODEM_FSK,  regName: 'FSK.SyncValue1',       value: 0xC1 },
        { modemType: MODEM_FSK,  regName: 'FSK.SyncValue2',       value: 0x94 },
        { modemType: MODEM_FSK,  regName: 'FSK.SyncValue3',       value: 0xC1 },
        { modemType: MODEM_FSK,  regName: 'FSK.PacketConfig1',    value: 0xD8 },
        { modemType: MODEM_FSK,  regName: 'FSK.FifoThresh',       value: 0x8F },
        { modemType: MODEM_FSK,  regName: 'FSK.ImageCal',         value: 0x02 },
        { modemType: MODEM_FSK,  regName: 'COM.DioMapping1',      value: 0x00 },
        { modemType: MODEM_FSK,  regName: 'COM.DioMapping2',      value: 0x30 },
        { modemType: MODEM_LORA, regName: 'LORA.MaxPayloadLength',value: 0x40 }
    ];

    var post = function () {
        self.reset().then(function () {
            return self.rxChainCalibration();
        }).then(function () {
            return self.setOpMode(TODO_MODE_Sleep);
        });
    };

    var seqCalls = [ post ];


    for (var i = 0; i < radioRegsInit.length; i++) {
        seqCalls.push(function () {
            return self.setModem(radioRegsInit[i].modemType).then(function () {
                return self.writeReg(radioRegsInit[i].regName, radioRegsInit[i].value);
            });
        });
    }

    seqCalls.push(function () {
        return self.setModem(MODEM_FSK).then(function () {
            self.state.radio = STATE_IDLE;
        });
    });

    seqCalls.reduce(function (soFar, f) {
        return soFar.then(f);
    }, Q(0)).fail(function (err) {
        deferred.reject(err);
    }).done(function () {
        deferred.resolve(bufLen);
    });

    return deferred.promise.nodeify(callback);
};

Sx1276.prototype.read = function (reg, callback) {
    var freg = findReg(reg);

    //if (freg)  { address, fileds: {} }
};

Sx1276.prototype.write = function (reg, val, callback) {
    var freg = findReg(reg);

    //if (freg)  { address, fileds: {} }

    // build packet
};

// OK
Sx1276.prototype.readReg = function (reg, callback) {
    // number
    // read a register
    // return number
    var self = this,
        pkt = Buffer.alloc(2);

    pkt[0] = addressToRead(address);
    pkt[1] = 0x00;              // dummy data while reading

    return this.cs.on().then(function () {
        return self.spi.write(outPkt);
    }).then(function (inPkt) {
        return self.cs.off().then(function () {
            return inPkt[1];    // number
        });
    }).nodeify(callback);
};

// OK
Sx1276.prototype.writeReg = function (address, val, callback) {
    // number, number
    // write to a register
    // return boolean

    var self = this,
        outPkt = Buffer.alloc(2);

    outPkt[0] = addressToWrite(address);
    outPkt[1] = val;    // will be auto transformed to an integer if it is a float number

    this.cs.on().then(function () {
        return self.spi.write(outPkt);
    }).then(function () {
        return self.cs.off();
    }).then(function () {
        return true;
    }).fail(function () {
        return false;
    }).nodeify(callback);
};

// OK
Sx1276.prototype.getChipVersion = function (callback) {
    return this.readReg('COM.Version').nodeify(callback);
};

Sx1276.prototype.reset = function (callback) {

};

Sx1276.prototype.readFifo = function (buffer, len) {
    // uint8_t *, number
    // read the FIFO into a buffer
    // 
};
Sx1276.prototype.writeFifo = function (buffer, len) {};

// OK
Sx1276.prototype.setChannel = function (freq, callback) {
    var self = this,
        freqDigits = (freq/TBD_FXOSC_STEP),
        freq = {
            msb: ((freqDigits >> 16) & 0xFF),
            mid: ((freqDigits >> 8) & 0xFF),
            lsb: (freqDigits & 0xFF)
        };

    return this.writeReg('COM.FrfMsb', freq.msb).then(function () {
        return self.writeReg('COM.FrfMid', freq.mid);
    }).then(function () {
        return self.writeReg('COM.FrfLsb', freq.lsb);
    }).then(function () {
        self.channel = freq;
        return freq;
    }).nodeify(callback);
};

// function opModeReg(currentOpMode, newOpMode) {
//     // otherBits = { modulation, freqMode }, opMode is the last 3 bits
//     var otherBits = (currentOpMode & ~(_OPMODE_Mode_MASK << _OPMODE_Mode_SHIFT)),
//         opModeReg = otherBits | (newOpMode << _OPMODE_Mode_SHIFT);

//     return opModeReg;
// }

// OK
Sx1276.prototype.setOpMode = function (opMode, callback) {
    var self = this,
        deferred = Q.defer(),
        currentOpMode = this.state.opMode;

    if (currentOpMode === opMode) {
        deferred.resolve();
        return deferred.promise.nodeify(callback);
    }

    this.readReg('COM.OpMode').then(function (chipOpMode) {
        var newRegVal = getNewRegVal(REG.OpMode, 'mode', chipOpMode, opMode);
        return self.write(REG.OpMode, newRegVal);
    }).then(function () {
        self.state.opMode = opMode;
    }).fail(function () {
        self.state.opMode = currentOpMode;
    }).done(deferred.resolve, deferred.reject);

    return deferred.promise.nodeify(callback);
};

Sx1276.prototype.setModem = function (modemType, callback) {

};

// ok
Sx1276.prototype.setSleep = function (callback) {
    var self = this;

    return this.setOpMode(TODO_OPMODE.Sleep).then(function () {
        self.state.radio = TODO_RADIO_STATE.idle;
    }).nodeify(callback);
};

// ok
Sx1276.prototype.setStandby = function (callback) {
    var self = this;

    return this.setOpMode(TODO_OPMODE.Standby).then(function () {
        self.state.radio = RADIO_STATE.idle;
    }).nodeify(callback);
};

Sx1276.prototype.getRSSI = function (modemType, callback) {};

Sx1276.prototype.isChannelFree = function (modemType, freq, rssiThresh, callback) {

};

Sx1276.prototype.sendStr = function (str, timeout, callback) {
    // String, Number(ms)
    // Send the supplied string. This writes the string into the FIFO and places the modem in transmit mode (via setTx()). This is a wrapper around send().
    // RADIO_EVENT_T

    var deferred = Q.defer();

    if (str.length > this._fifoSize)
        deferred.reject(new Error('Buffer size must be less than ' + this._fifoSize));

    // for LORA/FSK modem, there seems to be a 64 byte requirement,
    // (LOR_RegRxNbBytes on the receiver) never seems to be anything
    // other than 64. Same seems to go for the FSK modem.  So, if the
    // packet is less than 64, pad it out to 64 bytes.  This requires
    // investigation.

    if (str.length < 64) {
        // padding to 64 bytes
    }

    // [TODO]

    this.send();

  return send((uint8_t *)buffer.c_str(), buffer.size(), timeout);

    return deferred.promise.nodeify(callback);

};

Sx1276.prototype.send = function (buffer, size, timeout, callback) {
    // Uint8_t *, Number, Number(ms)
    // Send the supplied buffer. The writes the buffer into the FIFO and places the modem in transmit mode (via setTx()).
    // RADIO_EVENT_T
    return this.modem.send();
};


Sx1276.prototype.setTx = function (timeout, callback) {};
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
}
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

// OK
Sx1276.prototype.readFrequncy = function (callback) {
    var freq = { msb: null, mid: null, lsb: null };

    return self.readReg('COM.FrfMsb').then(function (fmsb) {
        freq.msb = fmsb;
        return self.readReg('COM.FrfMid');
    }).then(function (fmid) {
        freq.mid = fmid;
        return self.readReg('COM.FrfLsb');
    }).then(function (flsb) {
        freq.lsb = flsb;
        return ((freq.msb << 16) | (freq.mid << 8) | freq.lsb) * TODO_FXOSC_STEP;
    }).nodeify(callback);
};

Sx1276.prototype.runImageCalibration = function (callback) {
    return self.readReg('FSK.ImageCal').then(function (regVal) {
        reg = regVal;
        return self.writeReg('FSK.ImageCal', reg | TODO_IMAGECAL_ImageCalStart);
    }).nodeify(callback);

  // spin until complete
  while (readReg('FSK.ImageCal') & IMAGECAL_ImageCalRunning)
    usleep(1);

};

Sx1276.prototype.rxChainCalibration = function (callback) {
    var self = this,
        regPaConfigInitVal,
        initialFreq,
        reg;

    // this function should only be called in init() (after reset()), as
    // the device is configured for FSK mode, LF at that time.

    // Save context
    this.readReg('COM.PaConfig').then(function (regVal) {
        return regPaConfigInitVal = regVal;
    }).then(function () {
        return self.readFrequncy();
    }).then(function () {
        // Cut the PA just in case, RFO output, power = -1 dBm
        return self.writeReg('COM.PaConfig', 0);
    }).then(function () {
        // Launch Rx chain calibration for LF band
        return self.runImageCalibration();
    }).then(function () {
        // Set a Frequency in HF band
        return self.setChannel(868000000);
    }).then(function () {
        // Launch Rx chain calibration for HF band 
        return self.runImageCalibration();
    }).then(function () {
        // Restore context
        return self.writeReg('COM.PaConfig', regPaConfigInitVal);
    }).then(function () {
        return self.setChannel(initialFreq);
    }).nodeify(callback);
};

Sx1276.prototype.lookupFSKBandWidth = function (bw) {
    // This function looks up values in the fsk_bw_lookup_table and
    // returns the approprite register value to use for either the
    // FSK_RxBw or the FSK_RegAfcBw registers

    // See Table 40 in the datasheet
    var reg;

    FskBandwidths.forEach(function (rec) {
        if (!reg && bw >= rec.bandwidth) {
            reg = rec.value;
        }
    });

    return reg;
};

// init();
// startCAD();
// setMaxPayloadLength();
// csOn();
// csOff();

// lockIntrs();
// unlockIntrs();
// initClock();
// getMillis();

// ISRs
// static void onDio0Irq(void *ctx);
// static void onDio1Irq(void *ctx);
// static void onDio2Irq(void *ctx);
// static void onDio3Irq(void *ctx);
// static void onDio4Irq(void *ctx);
// static void onDio5Irq(void *ctx);

/*************************************************************************************************/
/*** Private Functions                                                                         ***/
/*************************************************************************************************/
var maskMap = [ 0, 1, 3, 7, 15, 31, 63, 127, 255 ];

function bitwideToMask(w) {
    return maskMap[w];
}

function getNewRegVal(reg, fieldName, oldVal, newVal) {
    var field,
        otherBits,
        newBits;

    if (!reg || !reg.fileds)
        return null;

    field = reg.fields[fieldName];

    if (!field)
        return null;

    otherBits = oldVal & ~(bitwideToMask(field.bitwide) << field.shift);
    newBits = otherBits | (newVal << field.shift);

    return newBits;
};

function addressToRead(address) {
    return (address & 0x7f);    // msb: 1(write), 0(read)
};

function addressToWrite(address) {
    return (address | 0x80);    // msb: 1(write), 0(read)
};
