var _ = require('busyman');

var CONST = require('../constants/constants'),
    OPMODE = CONST.OPMODE,
    BANDWIDTH = CONST.BANDWIDTH,
    FXOSC_FREQ = CONST.FXOSC_FREQ,
    FXOSC_STEP = CONST.FXOSC_STEP,
    DIO_MAPPING = CONST.DIO_MAPPING,
    RADIO_STATE = CONST.RADIO_STATE,
    DET_OPTIMIZE = CONST.DET_OPTIMIZE,
    DET_THRESHOLD = CONST.DET_THRESHOLD,
    RF_MID_BAND_THRESH = CONST.RF_MID_BAND_THRESH,
    LORA_RSSI_OFFSET_HF = CONST.LORA_RSSI_OFFSET_HF,
    LORA_RSSI_OFFSET_LF = CONST.LORA_RSSI_OFFSET_HF;

var lora = {},
    propWritable = { writable: true, enumerable: false, configurable: false };

Object.defineProperty(lora, 'chip', _.assign({ value: null }, propWritable));

Object.defineProperty(lora, 'settings', _.assign({
    value: {
        power: null, bandwidth: null, datarate: null, lowDatarateOptimize: null,
        coderate: null, preambleLen: null, fixLen: null, payloadLen: null,
        crcOn: null, freqHopOn: null, hopPeriod: null, iqInverted: null, rxContinuous: null
    }
}, propWritable));

Object.defineProperty(lora, 'packetState', _.assign({
    value: { snrValue: null, rssiValue: null, size: null }
}, propWritable));

lora.enable = function (callback) {
    var chip = lora.chip;

    return chip.setOpMode(OPMODE.Sleep).then(function () {
        return chip.write('COM.OpMode', { longRangeMode: 1 });  // turn lora on
    }).then(function () {
        return chip.writeReg('COM.DioMapping1', 0x00);
    }).then(function () {
        return chip.writeReg('COM.DioMapping2', 0x00);
    }).nodeify(callback);
};

lora.readRssi = function (callback) {
    var chip = lora.chip;

    return chip.readReg('LORA.RssiValue').then(function (val) {
        var rssi = (chip.channel > RF_MID_BAND_THRESH) ? LORA_RSSI_OFFSET_HF + val : LORA_RSSI_OFFSET_LF + val;
        return rssi;
    }).nodeify(callback);
};

lora.startCad = function (callback) {
    var chip = lora.chip;

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
        // DIO3 = CADDone
        return chip.write('COM.DioMapping1', { dio3Mapping: DIO_MAPPING.M00 });
    }).then(function () {
        chip.state.radio = RADIO_STATE.Cad;
        return chip.setOpMode(OPMODE.LoraCad);
    }).nodeify(callback);
};

lora.configTx = function (config, callback) {
    var deferred = Q.defer(),
        chip = lora.chip,
        settings = lora.settings,
        fdevDigits = Math.round(config.fdev / FXOSC_STEP),
        datarateDigits = Math.round(FXOSC_FREQ / config.datarate),
        bw = config.bandwidth;

    settings.power = config.power;

    switch (config.bandwidth) {
        case 125000:
            bw = BANDWIDTH.BW_125;
            break;

        case 250000:
            bw = BANDWIDTH.BW_250;
            break;

        case 500000:
            bw = BANDWIDTH.BW_500;
            break;

        default:
            deferred.reject(new Error('LoRa bandwidth must be 125000, 250000, or 500000'));
            return deferred.promise.nodeify(callback);
    }

    settings.bandwidth = config.bandwidth;
    settings.datarate = config.datarate;
    settings.coderate = config.coderate;
    settings.fixLen = config.fixLen;
    settings.preambleLen = config.preambleLen;
    settings.freqHopOn = config.freqHopOn;
    settings.hopPeriod = config.hopPeriod;
    settings.crcOn = config.crcOn;
    settings.iqInverted = config.iqInverted;

    // not set here: lowDatarateOptimize, payloadLen, rxContinuous

    // datarate is actually SPREADINGFACTOR_* for LoRa
    config.datarate = (config.datarate <  6) ?  6 : config.datarate;
    config.datarate = (config.datarate > 12) ? 12 : config.datarate;

    if ((bw === BANDWIDTH.BW_125) && (config.datarate === 11 || config.datarate === 12))
        settings.lowDatarateOptimize = true;
    else if ((bw === BANDWIDTH.BW_250) && (config.datarate === 12))
        settings.lowDatarateOptimize = true;
    else
        settings.lowDatarateOptimize = false;

    chip.write('LORA.ModemConfig1', {
        bw: bw,
        codingRate: settings.coderate,
        implicitHeaderModeOn: settings.fixLen ? 1 : 0
    }).then(function () {
        return chip.write('LORA.ModemConfig2', {
            spreadingFactor: config.datarate,
            //txContinuousMode: ,
            rxPayloadCrcOn: settings.crcOn ? 1 : 0,
            //symbTimeout: 
        });
    }).then(function () {
        return chip.write('LORA.ModemConfig3', {
            // unused: ,
            lowDataRateOptimize: settings.lowDatarateOptimize ? 1 : 0,
            // agcAutoOn: ,
            // reserved:
        });
    }).then(function () {
        return lora.setPreambleLen(settings.preambleLen);
    }).then(function () {
        // datarate is actually the LORA spreading factor
        return chip.write('LORA.DetectOptimize', {
            // see page 27 in the datasheet
            detectionOptimize: (config.datarate === 6) ? DET_OPTIMIZE.SF6 : DET_OPTIMIZE.SF7_SF12
        }).then(function () {
            return chip.writeReg('LORA.DetectionThreshold', (config.datarate === 6) ? DET_THRESHOLD.SF6 : DET_THRESHOLD.SF7_SF12);
        });
    }).then(function () {
        // The datasheet says this is only valid in FSK mode, but Semtech code 
        // indicates it is only available in LORA mode... So which is it?

        // Lets assume for now that the code is correct, as there is a HopPeriod 
        // register for LoRa, and no such registers exist for FSK.

        if (settings.freqHopOn) {
            return chip.write('LORA.PllHop', { fastHopOn: 1 }).then(function () {
                return chip.writeReg('LORA.HopPeriod', settings.hopPeriod);
            });
        } else {
            return chip.write('LORA.PllHop', { fastHopOn: 0 });
        }
    }).done(deferred.resolve, deferred.reject);


    return deferred.promise.nodeify(callback);
};

lora.readRssi = function () {
    var chip = lora.chip;

    return chip.readReg(REG_LORA.RssiValue).done(function (rssiOffset) {

        if (chip.channel > RF_MID_BAND_THRESH)
            rssi = LORA_RSSI_OFFSET_HF + rssiOffset;
        else
            rssi = LORA_RSSI_OFFSET_LF + rssiOffset;

        return rssi;
    }).done(deferred.resolve, deferred.reject);
};

// [TODO] need refactor
lora.send = function (buf, timeout, callback) {
    var deferred = Q.defer(),
        chip = lora.chip,
        writePayload,
        size;

    if (_.isString(buf))
        buf = Buffer.from(buf, 'utf8');

    if (!_.isBuffer(buf)) {
        deferred.reject(new TypeError('Data to send must be a string or a buffer'));
        return deferred.promise.nodeify(callback);
    }

    size = buf.length;

    if (lora.settings.iqInverted) {
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

    lora.settings.packetState.size = size;

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
        return lora.runTx();    // [TODO] lora or chip?
    });

    return deferred.promise.nodeify(callback);
};

lora.runTx = function (timeout, callback) {
    // DIO0 = PacketSent, DIO1 = FifoLevel,
    // DIO2 = FifoFull, DIO3 = FifoEmpty,
    // DIO4 = LowBat, DIO5 = ModeReady

    var chip = lora.chip,
        deferred = Q.defer(),
        isFreqHopping = lora.settings.freqHopOn,
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

lora.runRx = function (timeout, callback) {
    var chip = lora.chip,
        settings = lora.settings,
        bw = settings.bandwidth,
        regSets = [
            { value: 0x48, offset: 7.81e3  },   // 7.8 kHz
            { value: 0x44, offset: 10.42e3 },   // 10.4 kHz
            { value: 0x44, offset: 15.62e3 },   // 15.6 kHz
            { value: 0x44, offset: 20.83e3 },   // 20.8 kHz
            { value: 0x44, offset: 31.25e3 },   // 31.2 kHz
            { value: 0x44, offset: 41.67e3 },   // 41.4 kHz
            { value: 0x40, offset: 0       },   // 62.5 kHz
            { value: 0x40, offset: 0       },   // 125 kHz
            { value: 0x40, offset: 0       }    // 250 kHz
        ];

    switch (settings.bandwidth) {
        case 125000:
            bw = BANDWIDTH.BW_125;
            break;

        case 250000:
            bw = BANDWIDTH.BW_250;
            break;

        case 500000:
            bw = BANDWIDTH.BW_500;
            break;
        default:
            bw = 9; // let it >= 9
    }

    // The datasheet does not mention anything other than an InvertIQ bit (0x40) 
    // in RegInvertIQ register (0x33). Here, we seem to have two bits in RegInvertIQ
    // (existing one for RX), and a 'new' one for TXOff (0x01).  In addition,
    // INVERTIQ2 (0x3b) does not exist in the datasheet, it is marked as reserved.
    // We will assume that the datasheet is out of date.

    return chip.write('LORA.InvertIQ', {
        txOff: settings.iqInverted ? 0 : 1, // 1 for 'active' off
        rx: settings.iqInverted ? 1 : 0
    }).then(function () {
        // warning, hardcoded undocumented magic number into undocumented register
        return chip.writeReg('LORA.InvertIQ2', settings.iqInverted ? 0x19 : 0x1d);
    }).then(function () {
        // ERRATA 2.3 - Receiver Spurious Reception of a LoRa Signal
        if (bw < 9) {
            return chip.readReg('LORA.DetectOptimize').then(function (val) {
                // clear undocumented bit 7
                return chip.writeReg('LORA.DetectOptimize', (val & 0x7F));
            }).then(function () {
                return chip.write('LORA.Reserved2f', regSets[bw].value);
            }).then(function () {
                return chip.setChannel(chip.channel + regSets[bw].offset);
            });
        } else {
            return chip.readReg('LORA.DetectOptimize').then(function (val) {
                // set undocumented bit 7
                return chip.writeReg('LORA.DetectOptimize', (val | 0x80));
            });
        } 
    }).then(function () {
        if (settings.freqHopOn) {
            // mask out all except RxDone, RxTimeout, PayloadCrCError, and FhssChangeChannel
            return chip.write('LORA.IrqFlagsMask', {
                // rxTimeout:        ,
                // rxDone:           ,
                // payloadCrcError:  ,
                validHeader: 1,
                txDone: 1,
                cadDone: 1,
                // fhssChangeChannel:,
                cadDetected: 1
            }).then(function () {
                // DIO0 = RxDone, DIO2 = FhssChangeChannel
                return chip.write('COM.DioMapping1', {
                    dio0Mapping: DIO_MAPPING.M00,
                    dio2Mapping: DIO_MAPPING.M00,
                });
            });
        } else {
            // mask out all except RxDone, RxTimeout, and PayloadCrCError
            return chip.write('LORA.IrqFlagsMask', {
                // rxTimeout:        ,
                // rxDone:           ,
                // payloadCrcError:  ,
                validHeader: 1,
                txDone: 1,
                cadDone: 1,
                fhssChangeChannel: 1,
                cadDetected: 1
            }).then(function () {
                // DIO0 = RxDone
                return chip.write('COM.DioMapping1', {
                    dio0Mapping: DIO_MAPPING.M00

                });
            });
        }
    }).then(function () {
        return chip.writeReg('LORA.FifoRxBaseAddr', 0);
    }).then(function () {
        return chip.writeReg('LORA.FifoAddrPtr', 0);
    }).then(function () {
        // [TODO] clear chip._rxBuffer
        chip.state.radio = RADIO_STATE.Receiving;
        chip.state.radioEvent = RADIO_EVENT.Exec;

        if (settings.rxContinuous)
            return chip.setOpMode(OPMODE.LoraRxContinuous);
        else
            return chip.setOpMode(OPMODE.LoraRxSingle);
    });

};

lora.configRx = function (config) {
    // config = {
    //     bandwidth, bandwidthAfc, datarate, coderate, preambleLen,
    //     symbTimeout, fixLen, payloadLen, crcOn, freqHopOn, hopPeriod,
    //     iqInverted, rxContinuous
    // };
    var deferred = Q.defer(),
        chip = lora.chip,
        settings = lora.settings,
        bw = config.bandwidth;

    // convert the supplied (legal) LORA bandwidths into something
    // the chip can handle.
    switch (config.bandwidth) {
        case 125000:
            bw = BANDWIDTH.BW_125;
            break;
        case 250000:
            bw = BANDWIDTH.BW_250;
            break;
        case 500000:
            bw = BANDWIDTH.BW_500;
            break;
        default:
            deferred.reject(new Error('LORA bandwidth must be 125000, 250000, or 500000'))
            return deferred.promise.nodeify(callback);
            break;
    }

    settings.bandwidth = config.bandwidth;
    settings.datarate = config.datarate;
    settings.coderate = config.coderate;
    settings.fixLen = config.fixLen;
    settings.payloadLen = config.payloadLen;
    settings.crcOn = config.crcOn;
    settings.freqHopOn = config.freqHopOn;
    settings.hopPeriod = config.hopPeriod;
    settings.iqInverted = config.iqInverted;
    settings.rxContinuous = config.rxContinuous;

    // datarate is actually the LORA SPREADING_FACTOR_*
    config.datarate = (config.datarate > 12) ? 12 : config.datarate;
    config.datarate = (config.datarate <  6) ?  6 : config.datarate;

    if ((bw === BANDWIDTH.BW_125) && (config.datarate === 11 || config.datarate === 12))
        settings.lowDatarateOptimize = true;
    else if ((bw === BANDWIDTH.BW_250) && (config.datarate === 12))
        settings.lowDatarateOptimize = true;
    else
        settings.lowDatarateOptimize = false;


    chip.write('LORA.ModemConfig1', {
        bw: bw,
        codingRate: settings.coderate,
        implicitHeaderModeOn: settings.fixLen ? 1 : 0
    }).then(function () {
        return chip.write('LORA.ModemConfig2', {
            spreadingFactor: config.datarate,
            //txContinuousMode: ,
            rxPayloadCrcOn: settings.crcOn ? 1 : 0,
            symbTimeout: (config.symbTimeout >> 8)  // mask symbTimeOut (MSB) for safety [TODO] why?
        });
    }).then(function () {
        return chip.write('LORA.ModemConfig3', {
            // unused: ,
            lowDataRateOptimize: settings.lowDatarateOptimize ? 1 : 0,
            // agcAutoOn: ,
            // reserved:
        });
    }).then(function () {
        return lora.setSymbTimeout(config.symbTimeout);
    }).then(function () {
        return lora.setPreambleLen(config.preambleLen);
    }).then(function () {
        if (settings.fixLen)
            return chip.writeReg('LORA.PayloadLength', settings.payloadLen);
        else
            return true;
    }).then(function () {
        // The datasheet says this is only valid in FSK mode, but Semtech code 
        // indicates it is only available in LORA mode... So which is it?

        // Lets assume for now that the code is correct, as there is a HopPeriod 
        // register for LoRa, and no such registers exist for FSK.

        if (settings.freqHopOn) {
            return chip.write('LORA.PllHop', { fastHopOn: 1 }).then(function () {
                return chip.writeReg('LORA.HopPeriod', settings.hopPeriod);
            });
        } else {
            return chip.write('LORA.PllHop', { fastHopOn: 0 });
        }
    }).then(function () {
        // errata checks - writing magic numbers into undocumented, reserved registers :)
        // The Semtech code was broken in this logic.
        if ((bw === BANDWIDTH.BW_500) && (chip.channel > RF_MID_BAND_THRESH)) {
            // ERRATA 2.1 - Sensitivity Optimization with a 500 kHz
            // Bandwidth (HF)
            return chip.writeReg('LORA.Reserved36', 0x02).then(function () {
                return chip.writeReg('LORA.Reserved3a', 0x64);
            });
        } else if ((bw === BANDWIDTH.BW_500) && (chip.channel >= 410000000)) {
            // ERRATA 2.1 - Sensitivity Optimization with a 500 kHz
            // Bandwidth (LF above 410Mhz)
            return chip.writeReg('LORA.Reserved36', 0x02).then(function () {
                return chip.writeReg('LORA.Reserved3a', 0x7F);
            });
        } else {
            // ERRATA 2.1 - Sensitivity Optimization with a 500 kHz
            // Bandwidth (everything else)
            return chip.writeReg('LORA.Reserved36', 0x03);
        }
    }).then(function () {
        // datarate is actually the LORA spreading factor

        return chip.write('LORA.DetectOptimize', {
            // see page 27 in the datasheet
            detectionOptimize: (config.datarate === 6) ? DET_OPTIMIZE.SF6 : DET_OPTIMIZE.SF7_SF12
        }).then(function () {
            return chip.writeReg('LORA.DetectionThreshold', (config.datarate === 6) ? DET_THRESHOLD.SF6 : DET_THRESHOLD.SF7_SF12);
        });
    }).done(deferred.resolve, deferred.reject);

    return deferred.promise.nodeify(callback);
};

lora.setMaxPayloadLength = function (max, callback) {
    var chip = lora.chip;

    return chip.writeReg('LORA.MaxPayloadLength', max).nodeify(callback);
};

lora.setSymbTimeout = function (symTout, callback) {
    var chip = lora.chip;

    return chip.writeReg('LORA.SymbTimeoutLsb', symTout & 0xFF).nodeify(callback);
};

lora.setPreambleLen = function (len, callback) {
    var chip = lora.chip;

    return chip.writeReg('LORA.PreambleLsb', len & 0xFF).then(function () {
        return chipt.writeReg('LORA.PreambleMsb', (len >> 8) & 0xFF);
    }).nodeify(callback);
};

/*************************************************************************************************/
/*** ISR                                                                                       ***/
/*************************************************************************************************/
// TODO: onDio0Irq

lora.onDio1Irq = function () {
    var chip = lora.chip;

    //==> Lock Interrupts
    switch (chip.state.radio) {
        case RADIO_STATE.Idle:     // Idle
            break;
        case RADIO_STATE.Receiving:     // Receiving
            // Sync time out
            chip.state.radio = RADIO_STATE.Idle;
            chip.state.radioEvent = RADIO_EVENT.Timeout;
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

lora.onDio2Irq = function () {
    var chip = lora.chip;

    //==> Lock Interrupts
    switch (chip.state.radio) {
        case RADIO_STATE.Idle:          // Idle
            break;
        case RADIO_STATE.Receiving:     // Receiving
            if (lora.settings.freqHopOn) {
                // Clear Irq
                chip.write('LORA.IrqFlags', { fhssChangeChannel: 1 });
                // Fhss radio event (unsupported currently)
                // FhssChangeChannel( (readReg( LOR_RegHopChannel) & ~_HOPCHANNEL_FhssPresentChannel_MASK) );
            }
            break;
        case RADIO_STATE.Transmitting:  // Transmitting
            if (lora.settings.freqHopOn) {
                // Clear Irq
                chip.write('LORA.IrqFlags', { fhssChangeChannel: 1 });
                // Fhss radio event (unsupported currently)
                // FhssChangeChannel( (readReg( LOR_RegHopChannel) & ~_HOPCHANNEL_FhssPresentChannel_MASK) );
            }
            break;
        case RADIO_STATE.Cad:           // Cad
            // DO NOTHING
            break;
        default:
            // DO NOTHING
            break;
    }
};

lora.onDio3Irq = function () {
    //==> Lock Interrupts
    lora.chip.read('LORA.IrqFlags').then(function (data) {
        if (data.cadDetected) {
            // Clear IRQ
            // CADDetected radio event (true)
            lora.chip.write('LORA.IrqFlags', { cadDetected: 1, cadDone: 1 });
        } else {
            // Clear IRQ
            // CADDetected radio event (false)
            lora.chip.write('LORA.IrqFlags', { cadDone: 1 });
        }
    }).done();
    //==> Unloack Interrupts
};

lora.onDio4Irq = function () {
    //==> Lock Interrupts
        // Do Nothing for LoRa
    //==> Unloack Interrupts
};

lora.onDio5Irq = function () {
    //==> Lock Interrupts
    lora.chip.read('LORA.IrqFlags').then(function (data) {
        console.log(data);
    }).done();
    //==> Unloack Interrupts
};

module.exports = function (chip) {
    lora.chip = chip;
    return lora;
};
