module.exports = {
    "MType": {
        "JOINREQUEST": 0,
        "JOINACCEPT": 1,
        "UNCONFIRMDATAUP": 2,
        "UNCONFIRMDATADOWN": 3,
        "CONFIRMDATAUP": 4,
        "CONFIRMDATADOWN": 5,
        "RFU": 6,
        "PRORITEARY": 7
    },
    "SpreadFactor": {
        "SF_6": 6,
        "SF_7": 7,
        "SF_8": 8,
        "SF_9": 9,
        "SF_10": 10,
        "SF_11": 11,
        "SF_12": 12
    },
    "Bandwidth": {
        "BW_7.8KHZ": 0,
        "BW_10.4KHZ": 1,
        "BW_15.6KHZ": 2,
        "BW_20.8KHZ": 3,
        "BW_31.25KHZ": 4,
        "BW_41.7KHZ": 5,
        "BW_62.5KHZ": 6,
        "BW_125KHZ": 7,
        "BW_250KHZ": 8,
        "BW_500KHZ": 9
    },
    "CodingRate": {
        "CR_4/5": 1,
        "CR_4/6": 2,
        "CR_4/7": 3,
        "CR_4/8": 4
    },
    OPMODE: {
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
    },
    OPMODE_BV: {
        SHIFT: 0,
        Mode0: 0x01, // operating modes (sleep, etc)
        Mode1: 0x02,
        FSK_ModulationType_MASK: 3,
        Mode2: 0x04,
        FSK_ModulationType_SHIFT: 5,
        Mode_MASK: 7,
        LowFrequencyModeOn: 0x08,
        RSVD: 0x10,
        FSK_ModulationType0: 0x20,
        LOR_Reserved0x20: 0x20,
        FSK_ModulationType1: 0x40,
        LORA_AccessSharedReg: 0x40, // tmp sw to FSK regs
        LongRangeMode: 0x80 // LoRa mode enable(1), else FSK
    },
    REG: {
      Fifo: 0x00, // FIFO r/w access
      OpMode: 0x01, // LoRa/FSK
      FrfMsb: 0x06, // carrier freq
      FrfMid: 0x07,
      FrfLsb: 0x08,
      PaConfig: 0x09,
      PaRamp: 0x0a,
      Ocp: 0x0b, // overcurrent protection
      Lna: 0x0c,
      DioMapping1: 0x40, // DIO0-DIO3
      DioMapping2: 0x41, // DIO4-DIO5, clk out freq
      Version: 0x42, // Semtech ID (silicon revision)
      Tcxo: 0x4b,
      PaDac: 0x4d,
      FormerTemp : 0x5b,
      AgcRef: 0x61,
      AgcThresh1: 0x62,
      AgcThresh2: 0x63,
      AgcThresh3: 0x64,
      Pll: 0x70
    },
    REG_LORA : {
      RSVD02: 0x02, // reserved
      RSVD03: 0x03, // reserved
      RSVD04: 0x04, // reserved
      RSVD05: 0x05, // reserved
      FifoAddrPtr: 0x0d,
      FifoTxBaseAddr: 0x0e,
      FifoRxBaseAddr: 0x0f,
      FifoRxCurrentAddr: 0x10,
      IrqFlagsMask: 0x11,
      IrqFlags: 0x12,
      RxNbBytes: 0x13, // received pkt len
      RxHeaderCntValueMsb: 0x14,
      RxHeaderCntValueLsb: 0x15,
      RxPacketCntValueMsb: 0x16,
      RxPacketCntValueLsb: 0x17,
      ModemStat: 0x18,
      PktSnrValue: 0x19,
      PktRssiValue: 0x1a,
      RssiValue: 0x1b,
      HopChannel: 0x1c, // fhss starting channel
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
      RSVD27: 0x27, // reserved
      FeiMsb: 0x28,
      FeiMid: 0x29,
      FeiLsb: 0x2a,
      RSVD2b: 0x2b, // reserved
      RssiWideband: 0x2c,
      RSVD2d: 0x2d, // reserved
      RSVD2e: 0x2e, // reserved
      RSVD2f: 0x2f, // reserved
      RSVD30: 0x30, // reserved
      DetectOptimize: 0x31,
      RSVD32: 0x32, // reserved
      InvertIQ: 0x33,
      RSVD34: 0x34, // reserved
      RSVD35: 0x35, // reserved
      RSVD36: 0x36, // reserved
      DetectionThreshold: 0x37,
      RSVD38: 0x38, // reserved
      SyncWord: 0x39,
      RSVD3a: 0x3a, // reserved
      RSVD3b: 0x3b, // reserved (in datasheet)?
      InvertIQ2: 0x3b, // does not exist in datasheet
                                               // but used in Semtech code.
                                               // UNDOCUMENTED
      RSVD3c: 0x3c, // reserved
      RSVD3d: 0x3d, // reserved
      RSVD3e: 0x3e, // reserved
      RSVD3f: 0x3f, // reserved
      PllHop: 0x44,
      RSVD5d: 0x5d, // reserved
    },
    REG_FSK : {
      BitrateMsb: 0x02,
      BitrateLsb: 0x03,
      FdevMsb: 0x04, // freq deviation
      FdevLsb: 0x05,
      RxConfig: 0x0d,
      RssiConfg: 0x0e,
      RssiCollision: 0x0f,
      RssiThresh: 0x10,
      RssiValue: 0x11,
      RxBw: 0x12,
      AfcBw: 0x13, // automatic freq cntrl
      OokPeak: 0x14,
      OokFix: 0x15,
      OokAvg: 0x16,
      RSVD17: 0x17, // reserved
      RSVD18: 0x18, // reserved
      RSVD19: 0x19, // reserved
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
    },
    HEADERMODE: {
        EXPLICIT: 0,
        IMPLICIT: 1
    },
    FSK_MODULATION_TYPE: {
        FSK: 0,
        OOK: 1
    },

}