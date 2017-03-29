function Sx1276(spi, cs, reset) {
    this.spi = spi;
    this.cs = cs;
    this.reset = reset;

    this.state = {
        opMode: 0,
        radio: 0,       // idle, receiving, transmitting, cad
        radioEvent: 0   // done, exec, error, timeout
    };

    this.modem = null;
    this.channel = null;

    this.rxRSSI = null;
    this.rxSNR = null;
    this.rxLen = null;
    this.rxBuffer = null; // new Buffer(FIFO_SIZE)

    this.intrLock = null;
    // void lockIntrs() { pthread_mutex_lock(&m_intrLock); };
    // void unlockIntrs() { pthread_mutex_unlock(&m_intrLock); };

    this.startTime = 0;
    this.initClock = null;  // function
    this.getMillis = null;  // function

    this.onDio0Irq = null;
    this.onDio1Irq = null;
    this.onDio2Irq = null;
    this.onDio3Irq = null;
    this.onDio4Irq = null;
    this.onDio5Irq = null;
}

Sx1276.prototype.init = function () {
    var self = this;
    // some initial setup
    var radioRegsInit = [
        { modemType: MODEM_FSK,  address: COM_RegLna,             value: 0x23 },
        { modemType: MODEM_FSK,  address: FSK_RegRxConfig,        value: 0x1E },
        { modemType: MODEM_FSK,  address: FSK_RegRssiConfg,       value: 0xD2 },
        { modemType: MODEM_FSK,  address: FSK_RegPreambleDetect,  value: 0xAA },
        { modemType: MODEM_FSK,  address: FSK_RegOsc,             value: 0x07 },
        { modemType: MODEM_FSK,  address: FSK_RegSyncConfig,      value: 0x12 },
        { modemType: MODEM_FSK,  address: FSK_RegSyncValue1,      value: 0xC1 },
        { modemType: MODEM_FSK,  address: FSK_RegSyncValue2,      value: 0x94 },
        { modemType: MODEM_FSK,  address: FSK_RegSyncValue3,      value: 0xC1 },
        { modemType: MODEM_FSK,  address: FSK_RegPacketConfig1,   value: 0xD8 },
        { modemType: MODEM_FSK,  address: FSK_RegFifoThresh,      value: 0x8F },
        { modemType: MODEM_FSK,  address: FSK_RegImageCal,        value: 0x02 },
        { modemType: MODEM_FSK,  address: COM_RegDioMapping1,     value: 0x00 },
        { modemType: MODEM_FSK,  address: COM_RegDioMapping2,     value: 0x30 },
        { modemType: MODEM_LORA, address: LOR_RegMaxPayloadLength,value: 0x40 }
    ];

    var post = function () {
        self.reset().then(function () {
            return self.rxChainCalibration();
        }).then(function () {
            return self.setOpMode(MODE_Sleep);
        });
    };

    var seqCalls = [ post ];


    for (var i = 0; i < radioRegsInit.length; i++) {
        seqCalls.push(function () {
            return self.setModem(radioRegsInit[i].modemType).then(function () {
                return self.writeReg(radioRegsInit[i].address, radioRegsInit[i].value);
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

};





Sx1276.prototype.readReg = function (address, callback) {
    var self = this,
        outPkt = Buffer.alloc(2);

    outPkt[0] = addressToRead(address);
    outPkt[1] = 0x00;              // dummy data when reading

    return this._cs.on().then(function () {
        return self._spi.write(outPkt);
    }).then(function (inPkt) {
        return _cs.off().then(function () {
            return inPkt[1];    // number
        });
    }).nodeify(callback);
};

Sx1276.prototype.writeReg = function (address, val, callback) {
    var self = this,
        outPkt = Buffer.alloc(2);

    outPkt[0] = addressToWrite(address);
    outPkt[1] = val;    // will be auto transformed to an integer if it is a float number

    this._cs.on().then(function () {
        return self._spi.write(outPkt);
    }).then(function (inPkt) {
        return self._cs.off().then(function () {
            return true;
        });
    }).fail(function () {
        return false;
    }).nodeify(callback);
};

Sx1276.prototype.getChipVersion = function (callback) {
    return this.readReg(REG.VERSION).nodeify(callback);
};


Sx1276.prototype.reset = function (callback) {};
Sx1276.prototype.readFifo = function (buffer, len) {};
Sx1276.prototype.writeFifo = function (buffer, len) {};

Sx1276.prototype.setChannel = function (freq, callback) {
    var self = this,
        freqDigits = (freq/FXOSC_STEP),
        freqMSB = ((freqDigits >> 16) & 0xff),
        freqMID = ((freqDigits >> 8) & 0xff),
        freqLSB = (freqDigits & 0xff);

    return this.writeReg(REG.FrfMsb, freqMSB).then(function () {
        return self.writeReg(REG.FrfMid, freqMID);
    }).then(function () {
        return self.writeReg(REG.FrfLsb, freqLSB);
    }).then(function () {
        self.channel = freq;
        return freq;
    }).nodeify(callback);
};

function opModeReg(currentOpMode, newOpMode) {
    // otherBits = { modulation, freqMode }, opMode is the last 3 bits
    var otherBits = (currentOpMode & ~(_OPMODE_Mode_MASK << _OPMODE_Mode_SHIFT)),
        opModeReg = otherBits | (newOpMode << _OPMODE_Mode_SHIFT);

    return opModeReg;
}

Sx1276.prototype.setOpMode = function (opMode, callback) {
    var self = this,
        deferred = Q.defer(),
        currentOpMode = this.state.opMode;

    if (currentOpMode === opMode) {
        deferred.resolve();
        return deferred.promise.nodeify(callback);
    }

    this.state.opMode = opMode;

    this.readReg(REG.OpMode).then(function (currentOpMode) {
        var newRegVal = opModeReg(currentOpMode, opMode);
        return self.write(REG.OpMode, newRegVal);
    }).fail(function () {
        self.state.opMode = currentOpMode;
    }).done(deferred.resolve, deferred.reject);

    return deferred.promise.nodeify(callback);
};

Sx1276.prototype.setModem = function (modemType, callback) {};

Sx1276.prototype.setSleep = function (callback) {
    var self = this;

    return this.setOpMode(OPMODE.Sleep).then(function () {
        self.state.radio = RADIO_STATE.idle;
    }).nodeify(callback);
};

Sx1276.prototype.setStandby = function (callback) {
    var self = this;

    return this.setOpMode(OPMODE.Standby).then(function () {
        self.state.radio = RADIO_STATE.idle;
    }).nodeify(callback);
};



Sx1276.prototype.getRSSI = function (modemType, callback) {};
Sx1276.prototype.isChannelFree = function (modemType, freq, rssiThresh, callback) {};
Sx1276.prototype.sendStr = function (buffer, timeout, callback) {};
Sx1276.prototype.send = function (buffer, size, timeout, callback) {};
Sx1276.prototype.setTx = function (timeout, callback) {};
Sx1276.prototype.setRxConfig = function (modem, bandwidth, datarate, coderate, bandwidthAfc, preambleLen, symbTimeout, fixLen, payloadLen, crcOn, freqHopOn, hopPeriod, iqInverted, rxContinuous) {};
Sx1276.prototype.setTxConfig = function (modem, power, fdev, bandwidth, datarate, coderate, preambleLen, fixLen, crcOn, freqHopOn, hopPeriod, iqInverted) {};
Sx1276.prototype.setRx = function (timeout) {};


Sx1276.prototype.getRxBufferStr = function () {};
Sx1276.prototype.getRxBuffer = function () {}
Sx1276.prototype.getRxRSSI = function () {};
Sx1276.prototype.getRxSNR = function () {};
Sx1276.prototype.getRxLen = function () {};

// init();
// startCAD();
// setMaxPayloadLength();
// csOn();
// csOff();
// lookupFSKBandWidth();
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

function addressToRead(address) {
    return (address | 0x7f);    // msb: 1(write), 0(read)
};

function addressToWrite(address) {
    return (address & 0x80);    // msb: 1(write), 0(read)
};