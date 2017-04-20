var _ = require('busyman');

var createFskModem = reqiure('./modem/fsk'),
    createLoraModem = require('./modem/lora');
var CONST = require('./constants/constants');

var FXOSC_STEP = CONST.FXOSC_STEP;
var OPMODE = CONST.OPMODE;
var RADIO_STATE = CONST.RADIO_STATE;

var RF_MID_BAND_THRESH = CONST.RF_MID_BAND_THRESH;
var PA_PAC = CONST.PA_PAC;
var FIFO_SIZE = CONST.FIFO_SIZE;
var RADIO_EVENT = CONST.RADIO_EVENT;


function Sx1276(spi, cs, reset) {
    this._modems = {
        fsk: createFskModem(this),
        lora: createLoraModem(this)
    };

    this.state = {
        opMode: 1,      // Standby: 1@reset
        radio: 0,       // idle, receiving, transmitting, cad
        radioEvent: 0   // done, exec, error, timeout
    };

    this._rxBuffer = new Buffer(FIFO_SIZE);
}

Sx1276.prototype.readReg = function (regHdl, callback) {
    var self = this,
        addr = REG.addrToRead(regHdl),
        pkt = Buffer.alloc(2);

    pkt[0] = addr;
    pkt[1] = 0x00;  // dummy data while reading

    return Q.fcall(function () {
        if (addr === null)
            throw new TypeError('Bad register address: ' + regHdl);
        else
            return self.cs.on();
    }).then(function () {
        return self.spi.write(outPkt);
    }).then(function (inPkt) {
        return self.cs.off().then(function () {
            return inPkt[1];    // number
        });
    }).nodeify(callback);
};

Sx1276.prototype.writeReg = function (regHdl, val, callback) {  // return boolean
    var self = this,
        addr = REG.addrToWrite(regHdl),
        outPkt = Buffer.alloc(2);

    outPkt[0] = addr;
    outPkt[1] = val;    // will be auto transformed to an integer if it is a float number

    return Q.fcall(function () {
        if (addr === null)
            throw new TypeError('Bad register address: ' + regHdl);
        else
            return self.cs.on();
    }).then(function () {
        return self.spi.write(outPkt);
    }).then(function () {
        return self.cs.off();
    }).then(function () {
        return true;
    }).nodeify(callback);
};

Sx1276.prototype.read = function (regHdl, callback) {
    return this.readReg(regHdl).then(function (val) {
        return REG.parseRegVal(regHdl, val);    // number or object
    }).nodeify(callback);
};

Sx1276.prototype.write = function (regHdl, data, callback) {
    var self = this;

    this.readReg(regHdl).then(function (val) {
        var rebuiltVal = REG.rebuildRegVal(regHdl, val, data);
        return self.writeReg(regHdl, rebuiltVal);
    }).nodeify(callback);
};

Sx1276.prototype.readFifo = function (len, callback) {

};

Sx1276.prototype.writeFifo = function (buf, callback) {
    
};

Sx1276.prototype.sleep = function (callback) {
    return this.setOpMode(OPMODE.Sleep).nodeify(callback);
};

Sx1276.prototype.standby = function (callback) {
    return this.setOpMode(OPMODE.Standby).nodeify(callback);
};

Sx1276.prototype.reset = function (callback) {
    return this.reset.high()
            .delay(1)   // 1 ms
            .float()
            .delay(10)  // 10 ms
            .nodeify(callback);
};

Sx1276.prototype.init = function (cfg, callback) {
    var self = this,
        preProcessing,
        seqCalls;

    var modemRegsInit = [
        { type: 'fsk',  name: 'COM.Lna',              value: 0x23 },
        { type: 'fsk',  name: 'FSK.RxConfig',         value: 0x1E },
        { type: 'fsk',  name: 'FSK.RssiConfg',        value: 0xD2 },
        { type: 'fsk',  name: 'FSK.PreambleDetect',   value: 0xAA },
        { type: 'fsk',  name: 'FSK.Osc',              value: 0x07 },
        { type: 'fsk',  name: 'FSK.SyncConfig',       value: 0x12 },
        { type: 'fsk',  name: 'FSK.SyncValue1',       value: 0xC1 },
        { type: 'fsk',  name: 'FSK.SyncValue2',       value: 0x94 },
        { type: 'fsk',  name: 'FSK.SyncValue3',       value: 0xC1 },
        { type: 'fsk',  name: 'FSK.PacketConfig1',    value: 0xD8 },
        { type: 'fsk',  name: 'FSK.FifoThresh',       value: 0x8F },
        { type: 'fsk',  name: 'FSK.ImageCal',         value: 0x02 },
        { type: 'fsk',  name: 'COM.DioMapping1',      value: 0x00 },
        { type: 'fsk',  name: 'COM.DioMapping2',      value: 0x30 },
        { type: 'lora', name: 'LORA.MaxPayloadLength',value: 0x40 }
    ];

    preProcessing = function () {
        self.reset().then(function () {
            return self._rxChainCalibration();
        }).then(function () {
            return self.setOpMode(OPMODE.Sleep);
        });
    };

    seqCalls = [ preProcessing ];

    _.forEach(modemRegsInit, function (reg) {
        seqCalls.push(function () {
            return self.setModem(reg.type).then(function () {
                return self.writeReg(reg.name, reg.value);
            });
        });
    });

    seqCalls.push(function () {
        return self.setModem('fsk').then(function () {
            self.state.radio = RADIO_STATE.Idle;
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

Sx1276.prototype.runRx = function (timeout, callback) {
    var self = this,
        deferred = Q.defer(),
        checkRadioEvent;

    return this.modem.runRx().then(function () {
        checkRadioEvent = setInterval(function () {
            if (timeout === 0) {
                if (self.state.radioEvent === RADIO_EVENT.Exec) {
                    self.state.radioEvent = RADIO_EVENT.Timeout;
                    deferred.reject(new Error('Timeout'));
                }
                deferred.resolve(self.state.radioEvent);
                clearInterval(checkRadioEvent);
            } else if (self.state.radioEvent !== RADIO_EVENT.Exec) {
                clearInterval(checkRadioEvent);
                deferred.resolve(self.state.radioEvent);
            } else {
                timeout -= 1;
            }
        }, 1);
    });

    return deferred.promise.nodeify(callback);
};

/*************************************************************************************************/
/*** Set Methods                                                                               ***/
/*************************************************************************************************/
Sx1276.prototype.setChannel = function (freq, callback) {
    var self = this,
        freqDigits = (freq/FXOSC_STEP),
        newFreq = {
            msb: ((freqDigits >> 16) & 0xFF),
            mid: ((freqDigits >> 8) & 0xFF),
            lsb: (freqDigits & 0xFF)
        };

    return this.writeReg('COM.FrfMsb', newFreq.msb).then(function () {
        return self.writeReg('COM.FrfMid', newFreq.mid);
    }).then(function () {
        return self.writeReg('COM.FrfLsb', newFreq.lsb);
    }).then(function () {
        self.channel = freq;
        return freq;
    }).nodeify(callback);
};

Sx1276.prototype.setOpMode = function (mode, callback) {
    var self = this,
        deferred = Q.defer(),
        currentOpMode = this.state.opMode;

    if (currentOpMode === mode) {
        deferred.resolve();
        return deferred.promise.nodeify(callback);
    }

    this.write('COM.OpMode', { mode: mode }).then(function() {
        if (mode === OPMODE.Sleep || mode === OPMODE.Standby)
            self.state.radio = RADIO_STATE.Idle;

        self.state.opMode = mode;
    }).done(deferred.resolve, deferred.reject);

    return deferred.promise.nodeify(callback);
};

Sx1276.prototype.setModem = function (type, callback) {
    var self = this,
        deferred = Q.defer(),
        currentModem = this.modem,
        modem = this._modems[type.toLowerCase()];

    if (!modem) {
        deferred.reject(new Error('Bad modem type: ' + type));
    } else if (currentModem === modem) {
        deferred.resolve();
        return deferred.promise.nodeify(callback);
    } else {
        modem.enable().then(function () {
            self.modem = modem;
        }).fail(function () {
            self.modem = currentModem;
            return currentModem.enable();   // fall back
        }).done(deferred.resolve, deferred.reject);
    }

    return deferred.promise.nodeify(callback);
};

Sx1276.prototype.configTx = function (config, callback) {
    // config = {
    //     power, fdev, bandwidth, datarate, coderate,
    //     preambleLen, fixLen, crcOn, freqHopOn, hopPeriod, iqInverted
    // };

    var self = this,
        paCfg = {
            paSelect: (this.channel < RF_MID_BAND_THRESH) ? 1 : 0, // default 0: +14dBm, PA_BOOST 1: +20dBm
            maxPower: 7,    // PACONFIG_MaxPower = 7
            outputPower: 1
        },
        paDac = {
            paDac: 0
        };

    // PADAC_DEFAULT = 4, PADAC_BOOST = 7 (+20dBm on PA_BOOST when OuputPower = 1111)
    if (paCfg.paSelect === 1) {
        paDac.paDac = (config.power > 17) ? PA_PAC.BOOST : PA_PAC.DEFAULT;


        if (paDac.paDac === PA_PAC.BOOST) {
            config.power = (config.power <  5) ?  5 : config.power;
            config.power = (config.power > 20) ? 20 : config.power;
            paCfg.outputPower = config.power - 5;
        } else {
            config.power = (config.power <  2) ?  2 : config.power;
            config.power = (config.power > 17) ? 17 : config.power;
            paCfg.outputPower = config.power - 2;
        }
    } else {
        config.power = (config.power < -1) ? -1 : config.power;
        config.power = (config.power > 14) ? 14 : config.power;
        paCfg.outputPower = config.power + 1;
    }

    return this.write('COM.PaConfig', paCfg).then(function () {
        return self.write('COM.PaDac', paDac);
    }).then(function () {
        return self.modem.configTx();
    }).nodeify(callback);
};
/*************************************************************************************************/
/*** Get Methods                                                                               ***/
/*************************************************************************************************/

/*************************************************************************************************/
/*** Protected Prototype Methods                                                               ***/
/*************************************************************************************************/
Sx1276.prototype.query = function (name, callback) {
    // name: version, frequecny, - rssi, , rxRssi, rxSnr, rxLen, isChannelFree

    switch (name) {
        case 'version':
            return this.readChipVersion().nodeify(callback);
            break;
        case 'frequecny':
            return this.readFrequncy().nodeify(callback);
            break;
        case 'frequecny':
            return this.readFrequncy().nodeify(callback);
            break;
        case 'rssi':
            // TODO
            break;
    }
};

Sx1276.prototype.readChipVersion = function (callback) {
    return this.readReg('COM.Version').nodeify(callback);
};

Sx1276.prototype.readRssi = function (callback) {
    return this.modem.readRssi().nodeify(callback);
};

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
        return ((freq.msb << 16) | (freq.mid << 8) | freq.lsb) * FXOSC_STEP;
    }).nodeify(callback);
};

Sx1276.prototype.isChannelFree = function (freq, rssiThresh, callback) {
    var self = this;

    return this.setChannel(freq).then(function () {
        return self.setOpMode(OPMODE.FskRxMode);
    }).delay(1).then(function () {
        return self.query('rssi');
    }).then(function (rssi) {
        self.sleep();
        return rssi;
    }).then(function (rssi) {
        return (rssi < rssiThresh);
    }).nodeify(callback);
};

Sx1276.prototype._runImageCalibration = function (callback) {
    var self = this,
        deferred = Q.defer(),
        testCalRunning = null;

    this.write('FSK.ImageCal', { imageCalStart: 1 }).then(function () {
        // spin until complete
        testCalRunning = setInterval(function () {
            self.read('FSK.ImageCal').then(function (data) {
                if (!data.imageCalRunning) {
                    clearInterval(testCalRunning);
                    deferred.resolve();
                }
            }).fail(function (err) {
                clearInterval(testCalRunning);
                deferred.reject(err);
            });
        }, 1);
    }).fail(function(err) {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

Sx1276.prototype._rxChainCalibration = function (callback) {
    var self = this,
        paCfgInit,
        freqInit;

    // this function should only be called in init() (after reset()), as
    // the device is configured for FSK mode, LF at that time.

    // Save context
    return this.read('COM.PaConfig').then(function (paCfg) {
        paCfgInit = paCfg;
        return paCfg;
    }).then(function () {
        return self.query('frequncy');
    }).then(function (freq) {
        freqInit = freq;
        // Cut the PA just in case, RFO output, power = -1 dBm
        return self.write('COM.PaConfig', { paSelect: 0, maxPower: 0, outputPower: 0 });
    }).then(function () {
        // Launch Rx chain calibration for LF band
        return self._runImageCalibration();
    }).then(function () {
        // Set a Frequency in HF band
        return self.setChannel(868000000);
    }).then(function () {
        // Launch Rx chain calibration for HF band 
        return self._runImageCalibration();
    }).then(function () {
        // Restore context
        return self.write('COM.PaConfig', paCfgInit);
    }).then(function () {
        return self.setChannel(freqInit);
    }).nodeify(callback);
};
