var CONST = {};

// Our freq stepping resolution (in Hz) if FXOSC_FREQ is 32Mhz
// (FXOSC_FREQ / 2^19) =
CONST.FXOSC_STEP = 61.03515625;
// Our crystal oscillator frequency (32Mhz)
CONST.FXOSC_FREQ = 32000000.0;

// differentiator between high and low bands
CONST.RF_MID_BAND_THRESH = 525000000;

// LoRa RSSI offsets depending on LF or HF bands
CONST.LORA_RSSI_OFFSET_HF = -157;
CONST.LORA_RSSI_OFFSET_LF = -164;

CONST.FIFO_SIZE = 256;

CONST.FskBandwidths = [
    { bandwidth: 2600  , value: 0x17 },
    { bandwidth: 3100  , value: 0x0F },
    { bandwidth: 3900  , value: 0x07 },
    { bandwidth: 5200  , value: 0x16 },
    { bandwidth: 6300  , value: 0x0E },
    { bandwidth: 7800  , value: 0x06 },
    { bandwidth: 10400 , value: 0x15 },
    { bandwidth: 12500 , value: 0x0D },
    { bandwidth: 15600 , value: 0x05 },
    { bandwidth: 20800 , value: 0x14 },
    { bandwidth: 25000 , value: 0x0C },
    { bandwidth: 31300 , value: 0x04 },
    { bandwidth: 41700 , value: 0x13 },
    { bandwidth: 50000 , value: 0x0B },
    { bandwidth: 62500 , value: 0x03 },
    { bandwidth: 83333 , value: 0x12 },
    { bandwidth: 100000, value: 0x0A },
    { bandwidth: 125000, value: 0x02 },
    { bandwidth: 166700, value: 0x11 },
    { bandwidth: 200000, value: 0x09 },
    { bandwidth: 250000, value: 0x01 },
    { bandwidth: 300000, value: 0x00 }, // Invalid Badwidth
];

CONST.OPMODE = {
    Sleep: 0,
    Standby: 1,
    FsTx: 2,                // freq synth
    TxMode: 3,
    FsRx: 4,                // freq synth
    FskRxMode: 5,
    LoraRxContinuous: 5,    // continuous rx mode
    FskReserved6: 6,
    LoraRxSingle: 6,        // single packet rx mode
    FskReserved7: 7,
    LoraCad: 7              // channel activity detection
};

CONST. RADIO_STATE = {
    Idle: 0,
    Receiving: 1,
    Transmitting: 2,
    Cad: 3
};

CONST.RADIO_EVENT = {
    Done: 0,        // operation completed successfully
    Exec: 1,        // runninsg something
    Error: 2,       // failed, crc error, sync timeout
    Timeout: 3      // timed out
};

// DioXMapping values: See Tables 29, 30 (FSK), and 18 (LoRa) in datasheet
CONST.DIO_MAPPING = {
    M00: 0,
    M01: 1,
    M10: 2,
    M11: 3
};

CONST.BANDWIDTH = {
    BW_7_8: 0, // 7.8Khz
    BW_10_4: 1,
    BW_15_6: 2,
    BW_20_8: 3,
    BW_31_25: 4,
    BW_41_7: 5,
    BW_62_5: 6,
    BW_125: 7,
    BW_250: 8,
    BW_500: 9
};

// DetectionOptimize values
CONST.DET_OPTIMIZE = {
    SF7_SF12: 3,
    SF6: 5
};

// LOR_RegDetectionThreshold values
CONST.DET_THRESHOLD = {
    SF7_SF12: 0x0a,
    SF6: 0x0c
};

CONST.PA_PAC = {
    DEFAULT: 4,
    BOOST: 7
};
