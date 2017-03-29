// Datasheet Table 41 Registers Summary
var REG = {
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
    }
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
        adress: 0x61,
        fields: {
            unused:            { shift: 6, bitwide: 2 },
            AgcReferenceLevel: { shift: 0, bitwide: 6 }
        }
    },
    AgcThresh1: {
        adress: 0x62,
        fields: {
            unused:   { shift: 5, bitwide: 3 },
            AgcStep1: { shift: 0, bitwide: 5 }
        }
    },
    AgcThresh2: {
        adress: 0x63,
        fields: {
            AgcStep2: { shift: 4, bitwide: 4 },
            AgcStep3: { shift: 0, bitwide: 4 }
        }
    },
    AgcThresh3: {
        adress: 0x64,
        fields: {
            AgcStep4: { shift: 4, bitwide: 4 },
            AgcStep5: { shift: 0, bitwide: 4 }
        }
    },
    Pll: {
        adress: 0x70,
        fields: {
            PllBandwidth: { shift: 6, bitwide: 2 },
            reserved:     { shift: 0, bitwide: 6 }
        }
    }
};

// Table 42 Register Map (Page 93)
var REG_FSK = {

};

// 6.4. LoRa Mode Register Map (Page 108)
var REG_LORA = {

};


//-------------------------------------------------------------------
defs.REG_LORA = {
    Reserved02: 0x02,       // reserved
    Reserved03: 0x03,       // reserved
    Reserved04: 0x04,       // reserved
    Reserved05: 0x05,       // reserved
    FifoAddrPtr: 0x0d,
    FifoTxBaseAddr: 0x0e,
    FifoRxBaseAddr: 0x0f,
    FifoRxCurrentAddr: 0x10,
    IrqFlagsMask: 0x11,
    IrqFlags: 0x12,
    RxNbBytes: 0x13,    // received pkt len
    RxHeaderCntValueMsb: 0x14,
    RxHeaderCntValueLsb: 0x15,
    RxPacketCntValueMsb: 0x16,
    RxPacketCntValueLsb: 0x17,
    ModemStat: 0x18,
    PktSnrValue: 0x19,
    PktRssiValue: 0x1a,
    RssiValue: 0x1b,
    HopChannel: 0x1c,   // fhss starting channel
    ModemConfig1: 0x1d,
    ModemConfig2: 0x1e,
    SymbTimeoutLsb: 0x1f,
    PreambleMsb: 0x20,
    PreambleLsb: 0x21,
    PayloadLength: 0x22,
    MaxPayloadLength: 0x23,
    HopPeriod: 0x24,
    FifoRxByteAddr: 0x25,
    ModemConfig3: 0x26,
    Reserved27: 0x27,       // reserved
    FeiMsb: 0x28,
    FeiMid: 0x29,
    FeiLsb: 0x2a,
    Reserved2b: 0x2b,       // reserved
    RssiWideband: 0x2c,
    Reserved2d: 0x2d,       // reserved
    Reserved2e: 0x2e,       // reserved
    Reserved2f: 0x2f,       // reserved
    Reserved30: 0x30,       // reserved
    DetectOptimize: 0x31,
    Reserved32: 0x32,       // reserved
    InvertIQ: 0x33,
    Reserved34: 0x34,       // reserved
    Reserved35: 0x35,       // reserved
    Reserved36: 0x36,       // reserved
    DetectionThreshold: 0x37,
    Reserved38: 0x38,       // reserved
    SyncWord: 0x39,
    Reserved3a: 0x3a,       // reserved
    Reserved3b: 0x3b,       // reserved (in datasheet)?
    InvertIQ2: 0x3b,    // does not exist in datasheet, but used in Semtech code. UNDOCUMENTED
    Reserved3c: 0x3c,       // reserved
    Reserved3d: 0x3d,       // reserved
    Reserved3e: 0x3e,       // reserved
    Reserved3f: 0x3f,       // reserved
    PllHop: 0x44,
    Reserved5d: 0x5d,       // reserved
};

defs.REG_FSK = {
    BitrateMsb: 0x02,
    BitrateLsb: 0x03,
    FdevMsb: 0x04,      // freq deviation
    FdevLsb: 0x05,
    RxConfig: 0x0d,
    RssiConfg: 0x0e,
    RssiCollision: 0x0f,
    RssiThresh: 0x10,
    RssiValue: 0x11,
    RxBw: 0x12,
    AfcBw: 0x13,        // automatic freq cntrl
    OokPeak: 0x14,
    OokFix: 0x15,
    OokAvg: 0x16,
    Reserved17: 0x17,       // reserved
    Reserved18: 0x18,       // reserved
    Reserved19: 0x19,       // reserved
    AfcFei: 0x1a,
    AfcMsb: 0x1b,
    AfcLsb: 0x1c,
    FeiMsb: 0x1d,
    FeiLsb: 0x1e,
    PreambleDetect: 0x1f,
    RxTimeout1: 0x20,
    RxTimeout2: 0x21,
    RxTimeout3: 0x22,
    RxDelay: 0x23,
    Osc: 0x24,
    PreambleMsb: 0x25,
    PreambleLsb: 0x26,
    SyncConfig: 0x27,
    SyncValue1: 0x28,
    SyncValue2: 0x29,
    SyncValue3: 0x2a,
    SyncValue4: 0x2b,
    SyncValue5: 0x2c,
    SyncValue6: 0x2d,
    SyncValue7: 0x2e,
    SyncValue8: 0x2f,
    PacketConfig1: 0x30,
    PacketConfig2: 0x31,
    PayloadLength: 0x32,
    NodeAddr: 0x33,
    BroadcastAddr: 0x34,
    FifoThresh: 0x35,
    SeqConfig1: 0x36,
    SeqConfig2: 0x37,
    TimerResol: 0x38,
    Timer1Coeff: 0x39,
    Timer2Coeff: 0x3a,
    ImageCal: 0x3b,
    Temp: 0x3c,
    LowBat: 0x3d,
    IrqFlags1: 0x3e,
    IrqFlags2: 0x3f,
    Reserved44: 0x44,
    BitRateFrac: 0x5d
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