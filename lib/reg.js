var REG = { COM: null, FSK: null, LORA: null };

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
            PaSelect:    { shift: 7, bitwide: 1 },
            MaxPower:    { shift: 4, bitwide: 3 },
            OutputPower: { shift: 0, bitwide: 4 }
        }
    },
    PaRamp: {
        address: 0x0a,
        fields: {
            unused:            { shift: 7, bitwide: 1 },
            ModulationShaping: { shift: 5, bitwide: 2 },
            reserved:          { shift: 4, bitwide: 1 },
            PaRamp:            { shift: 0, bitwide: 4 }
        }
    },
    Ocp: {              // overcurrent protection
        address: 0x0b,
        fields: {
            unused:  { shift: 6, bitwide: 2 },
            OcpOn:   { shift: 5, bitwide: 1 },
            OcpTrim: { shift: 0, bitwide: 5 }
        }
    },
    Lna: {
        address: 0x0c,
        fields: {
            LnaGain:    { shift: 5, bitwide: 3 },
            LnaBoostLf: { shift: 3, bitwide: 2 },
            reserved:   { shift: 2, bitwide: 1 },
            LnaBoostHf: { shift: 0, bitwide: 2 }
        }
    },
    DioMapping1: {  // DIO0-DIO3
        address: 0x40,
        fields: {
            Dio0Mapping: { shift: 6, bitwide: 2 },
            Dio1Mapping: { shift: 4, bitwide: 2 },
            Dio2Mapping: { shift: 2, bitwide: 2 },
            Dio3Mapping: { shift: 0, bitwide: 2 }
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
            TcxoInputOn: { shift: 4, bitwide: 1 },
            reserved0:   { shift: 0, bitwide: 4 }
        }
    },
    PaDac: {
        address: 0x4d,
        fields: {
            reserved: { shift: 2, bitwide: 5 },
            PaDac:    { shift: 0, bitwide: 3 }
        }
    },
    FormerTemp: { address: 0x5b },
    AgcRef: {
        address: 0x61,
        fields: {
            unused:            { shift: 6, bitwide: 2 },
            AgcReferenceLevel: { shift: 0, bitwide: 6 }
        }
    },
    AgcThresh1: {
        address: 0x62,
        fields: {
            unused:   { shift: 5, bitwide: 3 },
            AgcStep1: { shift: 0, bitwide: 5 }
        }
    },
    AgcThresh2: {
        address: 0x63,
        fields: {
            AgcStep2: { shift: 4, bitwide: 4 },
            AgcStep3: { shift: 0, bitwide: 4 }
        }
    },
    AgcThresh3: {
        address: 0x64,
        fields: {
            AgcStep4: { shift: 4, bitwide: 4 },
            AgcStep5: { shift: 0, bitwide: 4 }
        }
    },
    Pll: {
        address: 0x70,
        fields: {
            PllBandwidth: { shift: 6, bitwide: 2 },
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
            Fdev:     { shift: 0, bitwide: 6 }
        }
    },
    FdevLsb: { address: 0x05 },
    RxConfig: {
        address: 0x0D,
        fields: {
            RestartRxOnCollision:    { shift: 7, bitwide: 1 },
            RestartRxWithoutPllLock: { shift: 6, bitwide: 1 },
            RestartRxWithPllLock:    { shift: 5, bitwide: 1 },
            AfcAutoOn:               { shift: 4, bitwide: 1 },
            AgcAutoOn:               { shift: 3, bitwide: 1 },
            RxTrigger:               { shift: 0, bitwide: 3 }
        }
    },
    RssiConfig: {
        address: 0x0E,
        fields: {
            RssiOffset:    { shift: 3, bitwide: 5 },
            RssiSmoothing: { shift: 0, bitwide: 3 }
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
            RxBwMant: { shift: 3, bitwide: 2 },
            RxBwExp:  { shift: 0, bitwide: 3 }
        }
    },
    AfcBw: {
        address: 0x13,
        fields: {
            reserved:    { shift: 5, bitwide: 3 },
            RxBwMantAfc: { shift: 3, bitwide: 2 },
            RxBwExpAfc:  { shift: 0, bitwide: 3 }
        }
    },
    OokPeak: {
        address: 0x14,
        fields: {
            reserved:         { shift: 6, bitwide: 2 },
            BitSyncOn:        { shift: 5, bitwide: 1 },
            OokThreshType:    { shift: 3, bitwide: 2 },
            OokPeakTheshStep: { shift: 0, bitwide: 3 }
        }
    },
    OokFix: { address: 0x15 },
    okAvg: {
        address: 0x16,
        fields: {
            OokPeakThreshDec:   { shift: 5, bitwide: 3 },
            reserved:           { shift: 4, bitwide: 1 },
            OokAverageOffset:   { shift: 2, bitwide: 2 },
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
            AgcStart:       { shift: 4, bitwide: 1 },
            reserved:       { shift: 3, bitwide: 1 },
            unused:         { shift: 2, bitwide: 1 },
            AfcClear:       { shift: 1, bitwide: 1 },
            AfcAutoClearOn: { shift: 0, bitwide: 1 }
        }
    },
    AfcMsb: { address: 0x1b },
    AfcLsb: { address: 0x1c },
    FeiMsb: { address: 0x1d },
    FeiLsb: { address: 0x1e },
    PreambleDetect: {
        address: 0x1f,
        fields: {
            PreambleDetectorOn:     { shift: 7, bitwide: 1 },
            PreambleDetectorSize:   { shift: 5, bitwide: 2 },
            PreambleDetectorTol:    { shift: 0, bitwide: 5 }
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
            RcCalStart: { shift: 3, bitwide: 1 },
            ClkOut:     { shift: 0, bitwide: 3 }
        }
    },
    PreambleMsb: { address: 0x25 },
    PreambleLsb: { address: 0x26 },
    SyncConfig: {
        address: 0x27,
        fields: {
            AutoRestartRxMode:  { shift: 6, bitwide: 2 },
            PreamblePolarity:   { shift: 5, bitwide: 1 },
            SyncOn:             { shift: 4, bitwide: 1 },
            reserved:           { shift: 3, bitwide: 1 },
            SyncSize:           { shift: 0, bitwide: 3 }
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
            PacketFormat:       { shift: 7, bitwide: 1 },
            DcFree:             { shift: 5, bitwide: 2 },
            CrcOn:              { shift: 4, bitwide: 1 },
            CrcAutoClearOff:    { shift: 3, bitwide: 1 },
            AddressFiltering:   { shift: 1, bitwide: 2 },
            CrcWhiteningType:   { shift: 0, bitwide: 1 }
        }
    },
    PacketConfig2: {
        address: 0x31,
        fields: {
            unused:             { shift: 7, bitwide: 1 },
            DataMode:           { shift: 6, bitwide: 1 },
            IoHomeOn:           { shift: 5, bitwide: 1 },
            IoHomePowerFrame:   { shift: 4, bitwide: 1 },
            BeaconOn:           { shift: 3, bitwide: 1 },
            PayloadLength:      { shift: 0, bitwide: 3 }
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
            RxTimeoutMask:         { shift: 7, bitwide: 1 },
            RxDoneMask:            { shift: 6, bitwide: 1 },
            PayloadCrcErrorMask:   { shift: 5, bitwide: 1 },
            ValidHeaderMask:       { shift: 4, bitwide: 1 },
            TxDoneMask:            { shift: 3, bitwide: 1 },
            CadDoneMask:           { shift: 2, bitwide: 1 },
            FhssChangeChannelMask: { shift: 1, bitwide: 1 },
            CadDetectedMask:       { shift: 0, bitwide: 1 }
        }
    },
    IrqFlags: {
        address: 0x12,
        fields: {
            RxTimeout:         { shift: 7, bitwide: 1 },
            RxDone:            { shift: 6, bitwide: 1 },
            PayloadCrcError:   { shift: 5, bitwide: 1 },
            ValidHeader:       { shift: 4, bitwide: 1 },
            TxDone:            { shift: 3, bitwide: 1 },
            CadDone:           { shift: 2, bitwide: 1 },
            FhssChangeChannel: { shift: 1, bitwide: 1 },
            CadDetected:       { shift: 0, bitwide: 1 }
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
            RxCodingRate:   { shift: 5, bitwide: 3 },
            ModemStatus:    { shift: 0, bitwide: 5 }  // bit4-bit0 use the same key
        }
    },
    PktSnrValue: { address: 0x19 },
    PktRssiValue: { address: 0x1a },
    RssiValue: { address: 0x1b },
    HopChannel: {
        address: 0x1c,
        fields: {
            PllTimeout:         { shift: 7, bitwide: 1 },
            CrcOnPayload:       { shift: 6, bitwide: 1 },
            FhssPresentChannel: { shift: 0, bitwide: 6 }
        }
    },
    ModemConfig1: {
        address: 0x1d,
        fields: {
            Bw:                     { shift: 4, bitwide: 4 },
            CodingRate:             { shift: 1, bitwide: 3 },
            ImplicitHeaderModeOn:   { shift: 0, bitwide: 1 }
        }
    },
    ModemConfig2: {
        address: 0x1e,
        fields: {
            SpreadingFactor:    { shift: 4, bitwide: 4 },
            TxContinuousMode:   { shift: 3, bitwide: 1 },
            RxPayloadCrcOn:     { shift: 2, bitwide: 1 },
            SymbTimeout:        { shift: 0, bitwide: 2 }
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
            LowDataRateOptimize:    { shift: 3, bitwide: 1 },
            AgcAutoOn:              { shift: 2, bitwide: 1 },
            Reserved:               { shift: 0, bitwide: 2 }
        }
    }
    Reserved27: { address: 0x27 }
    FeiMsb: {
        address: 0x28,
        fields: {
            Reserved:   { shift: 4, bitwide: 4 },
            FreqError:  { shift: 0, bitwide: 4 }
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
            Reserved:           { shift: 3, bitwide: 5 },
            DetectionOptimize:  { shift: 0, bitwide: 3 }
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
    DetectionThreshould: { address: 0x37 },
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

function buildReg(key, current, fields) {

}

function mask(bitwide) {
    var mask = 0xFF;
    return (mask >> (8 - bitwide));
}

module.exports = REG;
