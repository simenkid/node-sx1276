var _ = require('busyman');

var REG = {};

// Datasheet Table 41 Registers Summary
REG.COM = {
    Fifo: { address: 0x00 },    // FIFO r/w access
    OpMode: {                   // LoRa/FSK
        address: 0x01,
        fields: {
            longRangeMode:      { shift: 7, bitwide: 1 },
            modulationType:     { shift: 5, bitwide: 2 },
            reserved:           { shift: 4, bitwide: 1 },
            lowFrequencyModeOn: { shift: 3, bitwide: 1 },
            mode:               { shift: 0, bitwide: 3 }
        }
    },
    FrfMsb: { address: 0x06 },  // carrier freq
    FrfMid: { address: 0x07 },
    FrfLsb: { address: 0x08 },
    PaConfig: {
        address: 0x09,
        fields: {
            paSelect:    { shift: 7, bitwide: 1 },
            maxPower:    { shift: 4, bitwide: 3 },
            outputPower: { shift: 0, bitwide: 4 }
        }
    },
    PaRamp: {
        address: 0x0a,
        fields: {
            unused:            { shift: 7, bitwide: 1 },
            modulationShaping: { shift: 5, bitwide: 2 },
            reserved:          { shift: 4, bitwide: 1 },
            paRamp:            { shift: 0, bitwide: 4 }
        }
    },
    Ocp: {              // overcurrent protection
        address: 0x0b,
        fields: {
            unused:  { shift: 6, bitwide: 2 },
            ocpOn:   { shift: 5, bitwide: 1 },
            ocpTrim: { shift: 0, bitwide: 5 }
        }
    },
    Lna: {
        address: 0x0c,
        fields: {
            lnaGain:    { shift: 5, bitwide: 3 },
            lnaBoostLf: { shift: 3, bitwide: 2 },
            reserved:   { shift: 2, bitwide: 1 },
            lnaBoostHf: { shift: 0, bitwide: 2 }
        }
    },
    DioMapping1: {  // DIO0-DIO3
        address: 0x40,
        fields: {
            dio0Mapping: { shift: 6, bitwide: 2 },
            dio1Mapping: { shift: 4, bitwide: 2 },
            dio2Mapping: { shift: 2, bitwide: 2 },
            dio3Mapping: { shift: 0, bitwide: 2 }
        }
    },
    DioMapping2: {  // DIO4-DIO5, clk out freq
        address: 0x41,
        fields: {
            Dio4Mapping:       { shift: 6, bitwide: 2 },
            Dio5Mapping:       { shift: 4, bitwide: 2 },
            reserved:          { shift: 1, bitwide: 3 },
            MapPreambleDetect: { shift: 0, bitwide: 1 }
        }
    },
    Version: { address: 0x42 }, // Semtech ID (silicon revision)
    Tcxo: {
        address: 0x4b,
        fields: {
            reserved1:   { shift: 5, bitwide: 3 },
            tcxoInputOn: { shift: 4, bitwide: 1 },
            reserved0:   { shift: 0, bitwide: 4 }
        }
    },
    PaDac: {
        address: 0x4d,
        fields: {
            reserved: { shift: 2, bitwide: 5 },
            paDac:    { shift: 0, bitwide: 3 }
        }
    },
    FormerTemp: { address: 0x5b },
    AgcRef: {
        address: 0x61,
        fields: {
            unused:            { shift: 6, bitwide: 2 },
            agcReferenceLevel: { shift: 0, bitwide: 6 }
        }
    },
    AgcThresh1: {
        address: 0x62,
        fields: {
            unused:   { shift: 5, bitwide: 3 },
            agcStep1: { shift: 0, bitwide: 5 }
        }
    },
    AgcThresh2: {
        address: 0x63,
        fields: {
            agcStep2: { shift: 4, bitwide: 4 },
            agcStep3: { shift: 0, bitwide: 4 }
        }
    },
    AgcThresh3: {
        address: 0x64,
        fields: {
            agcStep4: { shift: 4, bitwide: 4 },
            agcStep5: { shift: 0, bitwide: 4 }
        }
    },
    Pll: {
        address: 0x70,
        fields: {
            pllBandwidth: { shift: 6, bitwide: 2 },
            reserved:     { shift: 0, bitwide: 6 }
        }
    }
};

// Table 42 Register Map (Page 93)
REG.FSK = {
    BitrateMsb: { address: 0x02 },
    BitrateLsb: { address: 0x03 },
    FdevMsb: {
        address: 0x04,
        fields: {
            reserved: { shift: 6, bitwide: 2 }
            fdev:     { shift: 0, bitwide: 6 }
        }
    },
    FdevLsb: { address: 0x05 },
    RxConfig: {
        address: 0x0D,
        fields: {
            restartRxOnCollision:    { shift: 7, bitwide: 1 },
            restartRxWithoutPllLock: { shift: 6, bitwide: 1 },
            restartRxWithPllLock:    { shift: 5, bitwide: 1 },
            afcAutoOn:               { shift: 4, bitwide: 1 },
            agcAutoOn:               { shift: 3, bitwide: 1 },
            rxTrigger:               { shift: 0, bitwide: 3 }
        }
    },
    RssiConfig: {
        address: 0x0E,
        fields: {
            rssiOffset:    { shift: 3, bitwide: 5 },
            rssiSmoothing: { shift: 0, bitwide: 3 }
        }
    },
    RssiCollision: { address: 0x0F },
    RssiThresh: { address: 0x10 },
    RssiValue: { address: 0x11 },
    RxBw: {
        address: 0x12,
        fields: {
            unused:   { shift: 7, bitwide: 1 },
            reserved: { shift: 5, bitwide: 2 },
            rxBwMant: { shift: 3, bitwide: 2 },
            rxBwExp:  { shift: 0, bitwide: 3 }
        }
    },
    AfcBw: {
        address: 0x13,
        fields: {
            reserved:    { shift: 5, bitwide: 3 },
            rxBwMantAfc: { shift: 3, bitwide: 2 },
            rxBwExpAfc:  { shift: 0, bitwide: 3 }
        }
    },
    OokPeak: {
        address: 0x14,
        fields: {
            reserved:         { shift: 6, bitwide: 2 },
            bitSyncOn:        { shift: 5, bitwide: 1 },
            ookThreshType:    { shift: 3, bitwide: 2 },
            ookPeakTheshStep: { shift: 0, bitwide: 3 }
        }
    },
    OokFix: { address: 0x15 },
    okAvg: {
        address: 0x16,
        fields: {
            ookPeakThreshDec:   { shift: 5, bitwide: 3 },
            reserved:           { shift: 4, bitwide: 1 },
            ookAverageOffset:   { shift: 2, bitwide: 2 },
            reserved:           { shift: 0, bitwide: 2 }
        }
    },
    Reserved17: { address: 0x17 },
    Reserved18: { address: 0x18 },
    Reserved19: { address: 0x19 },
    AfcFei: {
        address: 0x1a,
        fields: {
            unused:         { shift: 5, bitwide: 3 },
            agcStart:       { shift: 4, bitwide: 1 },
            reserved:       { shift: 3, bitwide: 1 },
            unused:         { shift: 2, bitwide: 1 },
            afcClear:       { shift: 1, bitwide: 1 },
            afcAutoClearOn: { shift: 0, bitwide: 1 }
        }
    },
    AfcMsb: { address: 0x1b },
    AfcLsb: { address: 0x1c },
    FeiMsb: { address: 0x1d },
    FeiLsb: { address: 0x1e },
    PreambleDetect: {
        address: 0x1f,
        fields: {
            preambleDetectorOn:     { shift: 7, bitwide: 1 },
            preambleDetectorSize:   { shift: 5, bitwide: 2 },
            preambleDetectorTol:    { shift: 0, bitwide: 5 }
        }
    },
    RxTimeout1: { address: 0x20 },
    RxTimeout2: { address: 0x21 },
    RxTimeout3: { address: 0x22 },
    RxDelay: { address: 0x23 },
    Osc: {
        address: 0x24,
        fields: {
            unused:     { shift: 4, bitwide: 4 },
            rcCalStart: { shift: 3, bitwide: 1 },
            clkOut:     { shift: 0, bitwide: 3 }
        }
    },
    PreambleMsb: { address: 0x25 },
    PreambleLsb: { address: 0x26 },
    SyncConfig: {
        address: 0x27,
        fields: {
            autoRestartRxMode:  { shift: 6, bitwide: 2 },
            preamblePolarity:   { shift: 5, bitwide: 1 },
            syncOn:             { shift: 4, bitwide: 1 },
            reserved:           { shift: 3, bitwide: 1 },
            syncSize:           { shift: 0, bitwide: 3 }
        }
    },
    SyncValue1: { address: 0x28 },
    SyncValue2: { address: 0x29 },
    SyncValue3: { address: 0x2a },
    SyncValue4: { address: 0x2b },
    SyncValue5: { address: 0x2c },
    SyncValue6: { address: 0x2d },
    SyncValue7: { address: 0x2e },
    SyncValue8: { address: 0x2f },
    PacketConfig1: {
        address: 0x30,
        fields: {
            packetFormat:       { shift: 7, bitwide: 1 },
            dcFree:             { shift: 5, bitwide: 2 },
            crcOn:              { shift: 4, bitwide: 1 },
            crcAutoClearOff:    { shift: 3, bitwide: 1 },
            addressFiltering:   { shift: 1, bitwide: 2 },
            crcWhiteningType:   { shift: 0, bitwide: 1 }
        }
    },
    PacketConfig2: {
        address: 0x31,
        fields: {
            unused:             { shift: 7, bitwide: 1 },
            dataMode:           { shift: 6, bitwide: 1 },
            ioHomeOn:           { shift: 5, bitwide: 1 },
            ioHomePowerFrame:   { shift: 4, bitwide: 1 },
            beaconOn:           { shift: 3, bitwide: 1 },
            payloadLength:      { shift: 0, bitwide: 3 }
        }
    },
    // 0x32 - 0x3f
    PaylaodLength: { address: 0x32 },
    NodeAdrs: { address: 0x33 },
    BroadcastAdrs: { address: 0x34 },
    FifoThresh: {
        address: 0x35,
        fields: {
            txStartCondition: { shift: 7, bitwide: 1 },
            unused: { shift: 6, bitwide: 1 },
            fifoThreshold: { shift: 0, bitwide: 6 }
        }
    },
    SeqConfig1: {
        address: 0x36,
        fields: {
            sequencerStart: { shift: 7, bitwide: 1 },
            sequencerStop: { shift: 6, bitwide: 1 },
            idleMode: { shift: 5, bitwide: 1 },
            fromStart: { shift: 3, bitwide: 2 },
            lowPowerSelection: { shift: 2, bitwide: 1 },
            fromIdle: { shift: 1, bitwide: 1 },
            fromTransmit: { shift: 0, bitwide: 1 }
        }
    },
    SeqConfig2: {
        address: 0x37,
        fields: {
            fromReceive: { shift: 5, bitwide: 3 },
            fromRxTimeout: { shift: 3, bitwide: 2 },
            fromPacketReceived: { shift: 0, bitwide: 3 }
        }
    },
    TimerResol: {
        address: 0x38,
        fields: {
            unused: { shift: 4, bitwide: 4 },
            timer1Resolution: { shift: 2, bitwide: 2 },
            timer2Resolution: { shift: 0, bitwide: 2 }
        }
    },
    Timer1Coef: { address: 0x39 },
    Timer2Coef: { address: 0x3a },
    ImageCal: {
        address: 0x3b,
        fields: {
            autoImageCalOn: { shift: 7, bitwide: 1 },
            imageCalStart: { shift: 6, bitwide: 1 },
            imageCalRunning: { shift: 5, bitwide: 1 },
            unused: { shift: 4, bitwide: 1 },
            tempChange: { shift: 3, bitwide: 1 },
            tempThreshold: { shift: 1, bitwide: 2 },
            tempMonitorOff: { shift: 0, bitwide: 1 }
        }
    },
    Temp: { address: 0x3c },
    LowBat: {
        address: 0x3d,
        fields: {
            unused: { shift: 4, bitwide: 4 },
            lowBatOn: { shift: 3, bitwide: 1 },
            lowBatTrim: { shift: 0, bitwide: 3 }
        }
    },
    IrqFlags1: {
        address: 0x3e,
        fields: {
            modeReady: { shift: 7, bitwide: 1 },
            rxReady: { shift: 6, bitwide: 1 },
            txReady: { shift: 5, bitwide: 1 },
            pllLock: { shift: 4, bitwide: 1 },
            rssi: { shift: 3, bitwide: 1 },
            timeout: { shift: 2, bitwide: 1 },
            preambleDetect: { shift: 1, bitwide: 1 },
            syncAddressMatch: { shift: 0, bitwide: 1 }
        }
    },
    IrqFlags2: {
        address: 0x3f,
        fields: {
            fifoFull: { shift: 7, bitwide: 1 },
            fifoEmpty: { shift: 6, bitwide: 1 },
            fifoLevel: { shift: 5, bitwide: 1 },
            fifoOverrun: { shift: 4, bitwide: 1 },
            packetSent: { shift: 3, bitwide: 1 },
            payloadReady: { shift: 2, bitwide: 1 },
            crcOk: { shift: 1, bitwide: 1 },
            lowBat: { shift: 0, bitwide: 1 }
        }
    },
    // 0x44
    PllHop: {
        address: 0x3c,
        fields: {
            fastHopOn: { shift: 7, bitwide: 1 },
            reserved: { shift: 0, bitwide: 7 }
        }
    },
    // 0x5d
    BitrateFrac: {
        address: 0x3c,
        fields: {
            unused: { shift: 4, bitwide: 4 },
            bitRateFrac: { shift: 0, bitwide: 4 }
        }
    },
};

// 6.4. LoRa Mode Register Map (Page 108)
REG.LORA = {
    Reserved02: { address: 0x02 },
    Reserved03: { address: 0x03 },
    Reserved04: { address: 0x04 },
    Reserved05: { address: 0x05 },
    FifoAddrPtr: { address: 0x0D },
    FifoTxBaseAddr: { address: 0x0E },
    FifoRxBaseAddr: { address: 0x0F },
    RxCurrentAddr: { address: 0x10 },
    IrqFlagsMask: {
        address: 0x11,
        fields: {
            rxTimeout:         { shift: 7, bitwide: 1 },
            rxDone:            { shift: 6, bitwide: 1 },
            payloadCrcError:   { shift: 5, bitwide: 1 },
            validHeader:       { shift: 4, bitwide: 1 },
            txDone:            { shift: 3, bitwide: 1 },
            cadDone:           { shift: 2, bitwide: 1 },
            fhssChangeChannel: { shift: 1, bitwide: 1 },
            cadDetected:       { shift: 0, bitwide: 1 }
        }
    },
    IrqFlags: {
        address: 0x12,
        fields: {
            rxTimeout:         { shift: 7, bitwide: 1 },
            rxDone:            { shift: 6, bitwide: 1 },
            payloadCrcError:   { shift: 5, bitwide: 1 },
            validHeader:       { shift: 4, bitwide: 1 },
            txDone:            { shift: 3, bitwide: 1 },
            cadDone:           { shift: 2, bitwide: 1 },
            fhssChangeChannel: { shift: 1, bitwide: 1 },
            cadDetected:       { shift: 0, bitwide: 1 }
        }
    },
    RxNbBytes: { address: 0x13 },
    RxHeaderCntValueMsb: { address: 0x14 },
    RxHeaderCntValueLsb: { address: 0x15 },
    RxPacketCntValueMsb: { address: 0x16 },
    RxPacketCntValueLsb: { address: 0x17 },
    ModemStat: {
        address: 0x18,
        fields: {
            rxCodingRate:   { shift: 5, bitwide: 3 },
            modemStatus:    { shift: 0, bitwide: 5 }  // bit4-bit0 use the same key
        }
    },
    PktSnrValue: { address: 0x19 },
    PktRssiValue: { address: 0x1a },
    RssiValue: { address: 0x1b },
    HopChannel: {
        address: 0x1c,
        fields: {
            pllTimeout:         { shift: 7, bitwide: 1 },
            crcOnPayload:       { shift: 6, bitwide: 1 },
            fhssPresentChannel: { shift: 0, bitwide: 6 }
        }
    },
    ModemConfig1: {
        address: 0x1d,
        fields: {
            bw:                     { shift: 4, bitwide: 4 },
            codingRate:             { shift: 1, bitwide: 3 },
            implicitHeaderModeOn:   { shift: 0, bitwide: 1 }
        }
    },
    ModemConfig2: {
        address: 0x1e,
        fields: {
            spreadingFactor:    { shift: 4, bitwide: 4 },
            txContinuousMode:   { shift: 3, bitwide: 1 },
            rxPayloadCrcOn:     { shift: 2, bitwide: 1 },
            symbTimeout:        { shift: 0, bitwide: 2 }
        }
    },
    SymbTimeoutLsb: { address: 0x1f },
    PreambleMsb: { address: 0x20 },
    PreambleLsb: { address: 0x21 },
    MaxPayloadLength: { address: 0x23 }
    HopPeriod: { address: 0x24 }
    FifoRxByteAddr: { address: 0x25 }
    ModemConfig3: {
        address: 0x26,
        fields: {
            unused:                 { shift: 4, bitwide: 4 },
            lowDataRateOptimize:    { shift: 3, bitwide: 1 },
            agcAutoOn:              { shift: 2, bitwide: 1 },
            reserved:               { shift: 0, bitwide: 2 }
        }
    }
    Reserved27: { address: 0x27 }
    FeiMsb: {
        address: 0x28,
        fields: {
            reserved:   { shift: 4, bitwide: 4 },
            freqError:  { shift: 0, bitwide: 4 }
        }
    }
    FeiMid: { address: 0x29 }
    FeiLsb: { address: 0x2a }
    Reserved2b: { address: 0x2b } 
    RssiWideband: { address: 0x2c }
    Reserved2d: { address: 0x2d } 
    Reserved2e: { address: 0x2e } 
    Reserved2f: { address: 0x2f }
    Reserved30: { address: 0x30 }
    DetectOptimize: {
        address: 0x31,
        fields: {
            reserved:           { shift: 3, bitwide: 5 },
            detectionOptimize:  { shift: 0, bitwide: 3 }
        }
    },
    // 0x32 ~ 0x3f
    // 0x32 - unused
    InvertIQ: {
        address: 0x33,
        fields: {
            reserved: { shift: 7, bitwide: 1 },
            invertIQ: { shift: 6, bitwide: 1 },
            reserved: { shift: 0, bitwide: 6 }
        }
    },
    // 0x34 ~ 0x36 - reserved
    DetectionThreshold: { address: 0x37 },
    // 0x38 - reserved
    SyncWord: { address: 0x39 },
    // 0x3a ~ 0x3f - reserved
    // 0x44 - unused
    // 0x5d - unused
};

function parseReg(key, val) {
    var fields = REG[key].fields,
        data;

    if (fields) {
        data = {};
        _.forEach(fields, function (v, k) {
            var shift = v.shift,
                bitwide = v.bitwide;

            data[k] = (val >> shift) & mask(bitwide);
        });
    } else {
        data = val;
    }

    return data;
}

// ok
REG.addr = function (reg) {
    var matchReg = REG.def(reg);
    return matchReg ? matchReg.address : null;
};

// ok
REG.addrToRead = function (addr) {
    addr = REG.addr(addr);

    if (addr === null)
        return null;

    return addr & 0x7F; // msb: 1(write), 0(read)
};

// ok
REG.addrToWrite = function (addr) {
    addr = REG.addr(addr);

    if (addr === null)
        return null;

    return addr | 0x80; // msb: 1(write), 0(read)
};

// ok
REG.def = function (reg) {
    var matchReg = null;

    if (typeof reg === 'string') {
        matchReg = _.get(REG, reg);
    } else if (typeof reg === 'number'){
        matchReg = _.find(REG.COM, function (rec) {
            return rec.address === reg;
        });

        matchReg = matchReg || _.find(REG.FSK, function (rec) {
            return rec.address === reg;
        });

        matchReg = matchReg || _.find(REG.LORA, function (rec) {
            return rec.address === reg;
        });
    }

    return matchReg;
};

// ok
REG.parseRegVal = function (regHdl, value) {
    var regDef = REG.def(regHdl),
        fields,
        data;

    if (!regDef)
        return null;
    else if (!regDef.fields)
        return value;
    else
        fields = regDef.fields;

    data = {};

    _.forEach(fields, function (bv, key) {
        data[key] = extractValueFromBits(value, bv.shift, bv.bitwide);
    });

    return data;
};

// ok
REG.rebuildRegVal = function (regHdl, currentVal, valObj) {
    var regDef = REG.def(regHdl),
        fields,
        byteVal = 0x00;

    if (_.isNumber(valObj))
        return valObj;

    if (!_.isObject(valObj))
        return null;

    if (!regDef || !regDef.fields)
        return value;

    fields = regDef.fields;

    _.forEach(valObj, function (v, key) {
        var bv = fields[key],
            mask;

        if (bv) {
            mask = maskMap[bv.bitwide];
            currentVal = currentVal & (~(mask << bv.shift));    // clear bits in currentVal
            byteVal = byteVal | transformValueToBits(v, bv.shift, bv.bitwide);
        }
    });

    return (currentVal | byteVal);
};

// ok
REG.buildRegVal = function (regHdl, valObj) {
    var regDef = REG.def(regHdl),
        fields,
        byteVal = 0x00;

    if (_.isNumber(valObj))
        return valObj;

    if (!_.isObject(valObj))
        return null;

    if (!regDef || !regDef.fields)
        return value;

    fields = regDef.fields;

    _.forEach(valObj, function (v, key) {
        var bv = fields[key];
        if (bv)
            byteVal = byteVal | transformValueToBits(v, bv.shift, bv.bitwide);
    });

    return byteVal;
};


/*************************************************************************************************/
/*** Private Functions                                                                         ***/
/*************************************************************************************************/
var maskMap = [ 0x00, 0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3F, 0x7F, 0xFF ];

function extractValueFromBits(value, shift, bitwide) {
    var mask = maskMap[bitwide];

    return ((value >> shift) & mask);
}

function transformValueToBits(value, shift, bitwide) {
    var mask = maskMap[bitwide];
    return ((value & mask) << shift);
}

module.exports = REG;
