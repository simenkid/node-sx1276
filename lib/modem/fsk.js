var CONST = require('../constants/constants');

var FXOSC_STEP = CONST.FXOSC_STEP;
var FXOSC_FREQ = CONST.FXOSC_FREQ;
var OPMODE = CONST.OPMODE;
var RADIO_STATE = CONST.RADIO_STATE;
var RADIO_EVENT = CONST.RADIO_EVENT;
var DIO_MAPPING = CONST.DIO_MAPPING;
var FskBandwidths = CONST.FskBandwidths;

function lookupFSKBandWidth(bw) {
    // This function looks up values in the fsk_bw_lookup_table and returns the approprite register value to use 
    // for either the FSK_RxBw or the FSK_RegAfcBw registers

    // See Table 40 in the datasheet
    var selected = _.find(FskBandwidths, function (rec, idx) {
        // { bandwidth: 250000, value: 0x01 }
        var nextRec = FskBandwidths[idx + 1];
        return ((bw > rec.bandwidth) && (bw < nextRec.bandwidth));
    });

    return selected ? selected.value : null;
};

var fsk = {
    chip: null,             // holds the sx1276 instance
    settings: {
        power: null,        // number
        fdev: null,         // number
        bandwidth: null,    // number
        bandwidthAfc: null, // number
        datarate: null,     // number
        preambleLen: null,  // number
        fixLen: null,       // bool
        payloadLen: null,   // number
        crcOn: null,        // bool
        iqInverted: null,   // bool
        rxContinuous: null  // bool
    },
    packetState: {
        preambleDetected: null,
        syncWordDetected: null,
        rssiValue: null,
        afcValue: null,
        rxGain: null,
        size: null,
        nbBytes: null,
        fifoThresh: null,
        chunkSize: null
    }
};

// ok
fsk.enable = function (callback) {
    var self = this,
        chip = this.chip;

    return chip.setOpMode(OPMODE.Sleep).then(function () {
        return chip.write('COM.OpMode', { longRangeMode: 0 });  // turn lora off
    }).then(function () {
        return chip.write('COM.DioMapping1', 0x00);
    }).then(function () {
        return chip.write('COM.DioMapping2', 0x30);             // DIO5 = ModeReady
    }).nodeify(callback);
};

// ok
fsk.readRssi = function (callback) {
    var chip = this.chip;

    return chip.readReg('FSK.RssiValue').then(function (rssi) {
        return -(rssi >> 1);    // devide by 2
    }).nodeify(callback);
};

// ok
fsk.startCad = function (callback) {
    var deferred = Q.defer();

    setImmediate(function () {
        deferred.reject(new Error('Channel activity detection only supported by LoRa modem'));
    });

    return deferred.promise.nodeify(callback);
};

// ok
fsk.configTx = function (config, callback) {
    var self = this,
        chip = this.chip,
        settings = this.settings,
        fdevDigits = Math.round(config.fdev / FXOSC_STEP),
        datarateDigits = Math.round(FXOSC_FREQ / config.datarate);

    settings.power = config.power;
    settings.fdev = config.fdev;
    settings.bandwidth = config.bandwidth;
    settings.datarate = config.datarate;
    settings.preambleLen = config.preambleLen;
    settings.fixLen = config.fixLen;
    settings.crcOn = config.crcOn;
    settings.iqInverted = config.iqInverted;
    // not set here: bandwidthAfc, payloadLen, rxContinuous

    return this.setFreqDev(fdevDigits).then(function () {
        return self.setBitRate(datarateDigits);
    }).then(function () {
        return self.setPreambleLen(config.preambleLen);
    }).then(function () {
        return chip.write('FSK.PacketConfig1', {
            packetFormat: config.fixLen ? 0 : 1,    // 1 for varirable length
            crcOn: config.crcOn ? 1 : 0
        });
    }).nodeify(callback);
};

fsk.send = function (buf, timeout, callback) {
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

    this.packetState.nbBytes = 0;
    this.packetState.size = size;
    this.packetState.chunkSize = (size > 0 && size <= 64) ? size : 32;

    // Write payload buffer
    writePayload = function (b, chunkSz) {
        return chip.writeFifo(b, chunkSz).then(function () {
            return self.packetState.nbBytes += self.packetState.chunkSize;
        });
    };

    if (this.settings.fixLen) {
        chip.writeReg('FSK.PayloadLength', size).then(function () {
            return writePayload(buf, self.packetState.chunkSize);
        }).then(function () {
            return chip.runTx();
        }).done(deferred.resolve, deferred.reject);
    } else {
        chip.writeFifo(size, 1).then(function () {
            return writePayload(buf, self.packetState.chunkSize);
        }).then(function () {
            return chip.runTx();
        }).done(deferred.resolve, deferred.reject);
    }

    return deferred.promise.nodeify(callback);
};

fsk.configRx = function (config) {
    var dataRate,
        self = this,
        chip = this.chip,
        settings = this.settings;

    settings.bandwidth = config.bandwidth,          // number
    settings.bandwidthAfc = config.bandwidthAfc,    // number
    settings.datarate = config.datarate,            // number
    settings.preambleLen = config.preambleLen,      // number
    settings.fixLen = config.fixLen,                // bool
    settings.payloadLen = config.payloadLen,        // number
    settings.crcOn = config.crcOn,                  // bool
    settings.iqInverted = config.iqInverted,        // bool
    settings.rxContinuous = config.rxContinuous     // bool

    dataRate = Math.round(FXOSC_FREQ/config.datarate); // To integer

    return this.setBitRate(dataRate).then(function () {
        var bw = lookupFSKBandwidth(settings.bandwidth);
        if (bw)
            return self.writeReg('FSK.RxBw', bw);
        else
            throw new Error('Invalid data rate: ' + config.datarate);
    }).then(function () {
        var afcBw = lookupFSKBandwidth(settings.bandwidthAfc);

        if (afcBw)
            return self.writeReg('FSK.AfcBw', afcBw);
        else
            throw new Error('Invalid AFC bandwidth: ' + config.bandwidthAfc);
    }).then(function () {
        return self.setPreambleLen(config.preambleLen);
    }).then(function () {
        if (settings.fixLen)
            return self.writeReg('FSK.PayloadLength', settings.payloadLen);
        else
            return true;
    }).then(function () {
        return self.write('FSK.PacketConfig1', {
            packetFormat: !settings.fixLen ? 1 : 0,
            crcOn: settings.crcOn ? 1 : 0
        });
    });
};

// ok
fsk.setBitRate = function (datarate, callback) {
    var chip = this.chip;

    return chip.writeReg('FSK.BitrateMsb', (datarate >> 8) & 0xFF).then(function () {
        return chip.writeReg('FSK.BitrateLsb', (datarate & 0xFF));
    }).nodeify(callback);
};

// ok
fsk.setFreqDev = function (fdev, callback) {
    var chip = this.chip;

    return chip.writeReg('FSK.FdevMsb', (fdev >> 8) & 0xFF).then(function () {
        return chip.writeReg('FSK.FdevMsb', (fdev & 0xFF));
    }).nodeify(callback);
};

// ok
fsk.setPreambleLen = function (preambleLen, callback) {
    var chip = this.chip;

    return chip.writeReg('FSK.PreambleMsb', (preambleLen >> 8) & 0xFF).then(function () {
        return chip.writeReg('FSK.PreambleLsb', (preambleLen & 0xFF));
    }).nodeify(callback);
};

//------------------------------------------------------
fsk.use = function () {
    this.setOpMode(OPMODE.Sleep).then(function () {
        return self.readReg(REG.OpMode);
    }).then(function (currentBits) {
        return currentBits | OPMODE_LongRangeMode; // turn lora on
    }).then(function (newBits) {
        return self.writeReg(REG.OpMode, newBits);
    }).then(function () {
        return self.writeReg(REG.DioMapping1, 0x00);
    }).then(function () {
        return self.writeReg(REG.DioMapping2, 0x00);
    }).then(function () {
        self.modemType = modemType;
    }).done(deferred.resolve, deferred.reject);
};

fsk.readRssi = function () {
    return this.readReg(REG_FSK.RssiValue).then(function (rssix2) {
        return rssix2/2;
    }).done(deferred.resolve, deferred.reject);
};

fsk.runTx = function (timeout, callback) {
    // DIO0 = PacketSent, DIO1 = FifoLevel,
    // DIO2 = FifoFull, DIO3 = FifoEmpty,
    // DIO4 = LowBat, DIO5 = ModeReady

    var self = this,
        chip = this.chip,
        deferred = Q.defer(),
        txRunningChecker;

    chip.write('COM.DioMapping1', { dio0Mapping: 0, dio2Mapping: 0 }).then(function () {
        return chip.write('COM.DioMapping2', { dio4Mapping: 0, dio5Mapping: 0 });
    }).then(function () {
        return chip.read('FSK.FifoThresh');
    }).then(function (data) {   // { txStartCondition, unused, fifoThreshold }
        self.packetState.fifoThresh = data.fifoThreshold;
        return data.fifoThreshold;
    }).then(function () {
        chip.state.radio = RADIO_STATE.Transmitting;
        chip.state.radioEvent = RADIO_EVENT.Exec;
        return chip.setOpMode(OPMODE.TxMode);
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

fsk.runRx = function (timeout, callback) {
    var chip = this.chip,
        settings = this.settings;
    // DIO0 = PayloadReady, DIO1 = FifoLevel, DIO2 = SyncAddr
    // DIO3 = FifoEmpty, DIO4 = Preamble, DIO5 = ModeReady

    return chip.write('COM.DioMapping1', {
        dio0Mapping: DIO_MAPPING.M00,
        dio2Mapping: DIO_MAPPING.M11
    }).then(function () {
        return chip.write('COM.DioMapping2', {
            dio4Mapping: DIO_MAPPING.M11,
            dio5Mapping: 0,
            mapPreambleDetect: 1
        });
    }).then(function () {
        return chip.read('FSK.FifoThresh');
    }).then(function (data) {
        settings.packetState.fifoThresh = data.fifoThreshold;
        settings.packetState.preambleDetected = false;
        settings.packetState.syncWordDetected = false;
        settings.packetState.nbBytes = 0;
        settings.packetState.size = 0;
    }).then(function () {
        // [TODO] clear chip._rxBuffer
        chip.state.radio = RADIO_STATE.Receiving;
        chip.state.radioEvent = RADIO_EVENT.Exec;

        return chip.setOpMode(OPMODE.FskRxMode);
    }).then(function () {
        if (!settings.rxContinuous) {
            // [TODO] ref to intel driver, a timer???
        }
    });
;
};

fsk.setMaxPayloadLength = function (max, callback) {
    var chip = fsk.chip;

    if (!fsk.settings.fixLen)
        return chip.writeReg('FSK.PayloadLength', max).nodeify(callback);
    else
        return Q(0).nodeify(callback);
};

/*************************************************************************************************/
/*** ISR                                                                                       ***/
/*************************************************************************************************/
// TODO: onDio0Irq

fsk.onDio1Irq = function () {
    var chip = fsk.chip;

    //==> Lock Interrupts
    switch (chip.state.radio) {
        case RADIO_STATE.Idle:     // Idle
            break;
        case RADIO_STATE.Receiving:     // Receiving
            // RxDone interrupt
            if (fsk.settings.crcOn) {
                chip.read('FSK.IrqFlags2').then(function (data) {
                    if (!data.crcOk) {
                        // Clear Irqs
                        chip.write('FSK.IrqFlags1', {
                            modeReady: 0,
                            rxReady: 0, 
                            txReady:0 ,
                            pllLock: 0,
                            rssi: 1, 
                            timeout: 0,
                            preambleDetect: 1,
                            syncAddressMatch: 1
                        }).then(function () {
                            return chip.write('FSK.IrqFlags2', {
                                fifoFull: 0,
                                fifoEmpty: 0,
                                fifoLevel: 0,
                                fifoOverrun: 1,
                                packetSent: 0,
                                payloadReady: 0,
                                crcOk: 0
                                lowBat: 0
                            });
                        });
                    }
                });
            }

            break;
        case RADIO_STATE.Transmitting:     // Transmitting
            // DO NOTHING
            break;
        case RADIO_STATE.Cad:     // Cad
            // DO NOTHING
            break;
        default:
            // DO NOTHING
            break;
    }
};

fsk.onDio1Irq = function () {
    var fsk = this,
        bytesToRead = 0,
        bytesToWrite = 0,
        isExceedFifo = false,
        preFetchLen;
    //==> Lock Interrupts
    switch (chip.state.radio) {
        case RADIO_STATE.Idle:     // Idle
            break;
        case RADIO_STATE.Receiving:     // Receiving
            // FifoLevel interrupt
            // Read received packet size
            if ((fsk.packetState.size === 0) && (fsk.packetState.nbBytes === 0)) {
                if (!fsk.settings.fixLen) {
                    preFetchLen = function () {
                        return chip.readFifo(1).then(function (sz) {
                            fsk.packetState.size = sz;
                        });
                    };
                } else {
                    preFetchLen = function () {
                        return chip.readReg('FSK.PayloadLength').then(function (len) {
                            fsk.packetState.size = len;
                        });
                    };
                }
            } else {
                preFetchLen = function () {
                    return Q(0);
                };
            }

            bytesToRead = (fsk.packetState.size - fsk.packetState.nbBytes);
            isExceedFifo =  bytesToRead > fsk.packetState.fifoThresh;
            bytesToRead = isExceedFifo ? fsk.packetState.fifoThresh : bytesToRead;

            preFetchLen().then(function () {
                return chip.readFifo(bytesToRead).then(function (data) {
                    fsk.packetState.nbBytes += bytesToRead;
                });
            }).done();
            break;
        case RADIO_STATE.Transmitting:     // Transmitting
            // FifoLevel interrupt
            bytesToWrite = (fsk.packetState.size - fsk.packetState.nbBytes);
            isExceedFifo = bytesToWrite > fsk.packetState.chunkSize;
            bytesToWrite = isExceedFifo ? fsk.packetState.chunkSize : bytesToWrite;

            // Write the chunk of data
            chip.writeFifo(bytesToWrite).then(function () {
                fsk.packetState.nbBytes += bytesToWrite;
            });

            break;
        case RADIO_STATE.Cad:     // Cad
            // DO NOTHING
            break;
        default:
            // DO NOTHING
            break;
    }
};

fsk.onDio2Irq = function () {
    var fsk = this,
        chip = this.chip;

    //==> Lock Interrupts
    switch (chip.state.radio) {
        case RADIO_STATE.Idle:          // Idle
            break;
        case RADIO_STATE.Receiving:     // Receiving
            if (fsk.packetState.preambleDetected && !fsk.packetState.syncWordDetected) {
                fsk.packetState.syncWordDetected = true;

                chip.readReg('FSK.RssiValue').then(function (val) {
                    fsk.packetState.rssiValue = -(val >> 1);
                    return chip.readReg('FSK.AfcMsb');
                }).then(function (afcMsb) {
                    return chip.readReg('FSK.AfcLsb').then(function (afcLsb) {
                        return ((afcMsb << 8) | afcLsb);
                    });
                }).then(function (afc) {
                    fsk.packetState.afcValue = afc * FXOSC_STEP;
                    return chip.read('COM.Lna').then(function (data) {
                        fsk.packetState.rxGain = data.lnaGain;
                    });
                }).done(function () {
                    //==> Unloack Interrupts
                }, function () {
                    //==> Unloack Interrupts
                });
            }
            break;
        case RADIO_STATE.Transmitting:  // Transmitting
            // DO NOTHING
            break;
        case RADIO_STATE.Cad:           // Cad
            // DO NOTHING
            break;
        default:
            // DO NOTHING
            break;
    }
};

fsk.onDio3Irq = function () {
    var fsk = this;
    //==> Lock Interrupts
        // Do Nothing for FSK
    //==> Unloack Interrupts
};

fsk.onDio4Irq = function () {
    var fsk = this;
    //==> Lock Interrupts
    if (!fsk.settings.packetState.preambleDetected)
        fsk.settings.packetState.preambleDetected = true;
    //==> Unloack Interrupts
};

fsk.onDio5Irq = function () {
    var fsk = this;
    //==> Lock Interrupts
        // Do Nothing for FSK
    //==> Unloack Interrupts
};
