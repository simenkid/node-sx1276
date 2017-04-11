
var FXOSC_FREQ = 32000000.0;    // FXOSC_FREQ is 32Mhz
var FXOSC_STEP = 61.03515625;   // (FXOSC_FREQ / 2^19)

// Datasheet Table 41 Registers Summary
REG.COM = {
    OpMode: {                   // LoRa/FSK
        longRangeMode: {
            Fsk: 0,
            Lora: 1
        },
        modulationType:     {
            Fsk: 0,
            Ook: 1
            // 2, 3 reserved
        },
        lowFrequencyModeOn: {
            Hf: 0,
            Lf: 1
        },
        mode: {
            Sleep: 0,
            Stdby: 1,
            FSTx: 2,                // freq synth
            Tx: 3,
            FSRx: 4,                // freq synth
            Rx: 5,          // FSK Rx, LoRa continuous rx mode
            // FSK_Reserved6: 6,
            // LORA_RxSingle: 6,       // single packet rx mode
            // FSK_Reserved7: 7,
            // LORA_CAD: 7             // channel activity detection
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


defs.FIFO_SIZE = 256;                   // total FIFO size
defs.RF_MID_BAND_THRESH = 525000000;    // differentiator between high and low bands
defs.LORA_RSSI_OFFSET_HF = -157;        // LoRa RSSI offsets depending on LF or HF bands
defs.LORA_RSSI_OFFSET_LF = -164;

// Our crystal oscillator frequency (32Mhz)
defs.FXOSC_FREQ = 32000000.0;
// Our freq stepping resolution (in Hz) if FXOSC_FREQ is 32Mhz
// (FXOSC_FREQ / 2^19) =
defs.FXOSC_STEP = 61.03515625;   // v


defs.MODEM_TYPE = {
    Lora: 0,
    Fsk: 1
};

defs.RADIO_EVENT = {
    Done: 0,
    Exec: 1,
    Error: 2,
    Timeout: 3
};

defs.MODE = {
    Sleep: 0,
    Standby: 1,
    FSTX: 2,                // freq synth
    TxMode: 3,
    FSRX: 4,                // freq synth
    FSK_RxMode: 5,
    LORA_RxContinuous: 5,   // continuous rx mode
    FSK_Reserved6: 6,
    LORA_RxSingle: 6,       // single packet rx mode
    FSK_Reserved7: 7,
    LORA_CAD: 7             // channel activity detection
};

defs.FSK_MOD_TYPE = {
    Fsk: 0,
    Ook: 1
};

// PaSelect[7], MaxPower[6:4], OutputPower[3:0]
defs.PACONFIG_BITS = {
    OutputPower0: 0x01,
    OutputPower1: 0x02,
    OutputPower2: 0x04,
    OutputPower3: 0x08,
    MaxPower0: 0x10,
    MaxPower1: 0x20,
    MaxPower1: 0x40,
    PaSelect: 0x80,         //  0 = 14dBm, 1 = 20dBm
    OutputPower_Mask: 0x0F,
    OutputPower_Shift: 0,
    MaxPower_Mask: 0x07,
    MaxPower_Shift: 4
};

// Unused[7], ModulationShaping[6:5], Reserved[4], PaRamp[3:0]
defs.PARAMP_BITS = {
    PaRamp0: 0x01, // rise/fall of ramp up/down
    PaRamp1: 0x02,
    PaRamp2: 0x04,
    PaRamp3: 0x08,
    Reserved: 0x01,
    LORA_Reserved0: 0x20,
    LORA_Reserved0: 0x40,
    FSK_ModulationShaping0: 0x20,
    FSK_ModulationShaping1: 0x40,
    PaRamp_Mask: 0x03,
    PaRamp_Shift: 0,
    Reserved_Mask: 0x01
    Reserved_Shift: 4,
    LORA_Reserved_Mask: 0x03,
    LORA_Reserved_Shift: 5,
    FSK_ModulationShaping_MASK: 0x03,
    FSK_ModulationShaping_SHIFT: 5
};

defs.PARAMP = {
    '3_4ms': 0, // 3.4ms
    '2ms': 1,
    '1ms': 2,
    '500us': 3, // 500us
    '250us': 4,
    '125us': 5,
    '100us': 6,
    '62us': 7,
    '50us': 8,
    '40us': 9,
    '31us': 10,
    '25us': 11,
    '20us': 12,
    '15us': 13,
    '12us': 14,
    '10us': 15
};

defs.MODSHAPING = {
    NoShaping: 0,
    FSK_GaussianFilterBT1: 1,   // BT = 1.0
    FSK_GaussianFilterBT05: 2,  // BT = 0.5
    FSK_GaussianFilterBT03: 3,  // BT = 0.3
    OOK_FCutoffBitRate: 1,      // Fcutoff = BitRate
    OOK_FCutoffBitRate2: 2      // Fcutoff = 2*BitRate
    // for OOK, 3 is reserved
};

// Unused[7:6], OcpOn[5], OcpTrim[4:0]
defs.OCP_BITS = {
    OcpTrim0: 0x01,
    OcpTrim1: 0x02,
    OcpTrim2: 0x04,
    OcpTrim3: 0x08,
    OcpOn: 0x10,
    OcpTrim_Mask : 15,
    OcpTrim_Shift: 0
    // 0x20-0x80 reserve
};

// LnaGain[7:5], LnaBoostLf[4:3], Reserved[2], LnaBoostHf[1:0]
defs.LNA_BITS = {
      LnaBoostHf0: 0x01,
      LnaBoostHf1: 0x02,
      LnaBoostHf_MASK: 3,
      LnaBoostHf_SHIFT: 0,

      // 0x04 reserved

      LnaBoostLf0: 0x08,
      LnaBoostLf1: 0x10,
      LnaBoostLf_MASK: 3,
      LnaBoostLf_SHIFT: 3,

      LnaGain0: 0x20,
      LnaGain1: 0x40,
      LnaGain2: 0x80,
      LnaGain_MASK: 7,
      LnaGain_SHIFT: 5
};

defs.LNABOOSTHF = {
      Default: 0,
      // 1-2 reserved
      BoostOn: 3, // 150% LNA current
};

defs.LNABOOSTLF = {
      Default: 0,
      // 1-3 reserved
};

defs.LNAGAIN = {
    // 0 reserved
    G1: 1, // max gain
    G2: 2,
    G3: 3,
    G4: 4,
    G5: 5,
    G6: 6  // minimum gain
    // 7 reserved
};

// LongRangeMode[7], ModulationType[6:5], Reserved[4], LowFreqModeOn[3], Mode[2:0]
defs.OPMODE_BITS = {
    Mode0: 0x01,
    Mode1: 0x02,
    Mode3: 0x04,
    LowFrequencyModeOn: 0x08,
    Reserved: 0x10,
    FSK_ModulationType0: 0x20,
    FSK_ModulationType1: 0x40,
    LORA_Reserved: 0x20,
    LORA_AccessSharedReg: 0x40,
    LongRangeMode: 0x80,
    Mode_Mask: 0x07,
    Mode_Shift: 0,
    FSK_ModulationType_Mask: 0x03,
    FSK_ModulationType_Shift: 5
};

defs.OPMODE = {
    Sleep: 0,
    Standby: 1,
    FSTX: 2,              // freq synth
    TxMode: 3,
    FSRX: 4,              // freq synth
    FSK_RxMode: 5,
    LORA_RxContinuous: 5, // continuous rx mode
    FSK_Reserved6: 6,
    LORA_RxSingle: 6,     // single packet rx mode
    FSK_Reserved7: 7,
    LORA_CAD: 7           // channel activity detection
};

defs.REG = {
    Fifo: 0x00,         // FIFO r/w access
    OpMode: 0x01,       // LoRa/FSK
    FrfMsb: 0x06,       // carrier freq
    FrfMid: 0x07,
    FrfLsb: 0x08,
    PaConfig: 0x09,
    PaRamp: 0x0a,
    Ocp: 0x0b,          // overcurrent protection
    Lna: 0x0c,
    DioMapping1: 0x40,  // DIO0-DIO3
    DioMapping2: 0x41,  // DIO4-DIO5, clk out freq
    Version: 0x42,      // Semtech ID (silicon revision)
    Tcxo: 0x4b,
    PaDac: 0x4d,
    FormerTemp : 0x5b,
    AgcRef: 0x61,
    AgcThresh1: 0x62,
    AgcThresh2: 0x63,
    AgcThresh3: 0x64,
    Pll: 0x70
};

defs.REG_LORA = {
    RSVD02: 0x02,       // reserved
    RSVD03: 0x03,       // reserved
    RSVD04: 0x04,       // reserved
    RSVD05: 0x05,       // reserved
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
    RSVD27: 0x27,       // reserved
    FeiMsb: 0x28,
    FeiMid: 0x29,
    FeiLsb: 0x2a,
    RSVD2b: 0x2b,       // reserved
    RssiWideband: 0x2c,
    RSVD2d: 0x2d,       // reserved
    RSVD2e: 0x2e,       // reserved
    RSVD2f: 0x2f,       // reserved
    RSVD30: 0x30,       // reserved
    DetectOptimize: 0x31,
    RSVD32: 0x32,       // reserved
    InvertIQ: 0x33,
    RSVD34: 0x34,       // reserved
    RSVD35: 0x35,       // reserved
    RSVD36: 0x36,       // reserved
    DetectionThreshold: 0x37,
    RSVD38: 0x38,       // reserved
    SyncWord: 0x39,
    RSVD3a: 0x3a,       // reserved
    RSVD3b: 0x3b,       // reserved (in datasheet)?
    InvertIQ2: 0x3b,    // does not exist in datasheet, but used in Semtech code. UNDOCUMENTED
    RSVD3c: 0x3c,       // reserved
    RSVD3d: 0x3d,       // reserved
    RSVD3e: 0x3e,       // reserved
    RSVD3f: 0x3f,       // reserved
    PllHop: 0x44,
    RSVD5d: 0x5d,       // reserved
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
    RSVD17: 0x17,       // reserved
    RSVD18: 0x18,       // reserved
    RSVD19: 0x19,       // reserved
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
    RSVD44: 0x44,
    BitRateFrac: 0x5d
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

