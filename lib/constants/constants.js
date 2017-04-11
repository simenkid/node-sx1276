
var FskBandwidths = [
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

var RadioState = {
    Idle: 0,
    RxRunning: 1,
    TxRunning: 2,
    Cad: 3
};

var RadioEvent = {
    Done: 0,        // operation completed successfully
    Exec: 1,        // runninsg something
    Error: 2,       // failed, crc error, sync timeout
    Timeout: 3      // timed out
};

