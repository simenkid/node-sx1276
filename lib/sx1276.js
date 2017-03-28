var util = require('util'),
    EventEmitter = require('events');

var Q = require('q'),
    m = require('mraa'),
    _ = require('busyman');

var CNST = require('./constants.json'),
    OPMODE = CNST.OPMODE,
    REG = CNST.REG;

var WRITE_MODE = 0x80,
    FIFO_SIZE = 256;

// // Chip Select control (active LOW)
// void csOn() 
// {
//   m_gpioCS.write(0);
// };

// void csOff() 
// {
//   m_gpioCS.write(1);
// };

// [TODO] promisify the spi.read(), spi.write()
// [TODO] promisify the cs.on(), cs.off()

var MODEM_TYPE = { lora: 0, fsk: 1 };
var RADIO_EVENT = { done: 0, exec: 1, error: 2, timeout: 3 };
var RADIO_STATE = { idle: 0, receiving: 1, tranmitting: 2, cad: 3 };

function Sx1276(spi, cs, reset) {

    var fskRadioSettings = {
        power: null, fdev: null, bandwidth: null, bandwidthAfc: null, datarate: null, preambleLen: null,
        fixLen: null, payloadLen: null, crcOn: null, iqInverted: null, rxContinuous: null
    };

    var loraRadioSettings = {
        power: null, bandwidth: null, datarate: null, lowDatarateOptimize: null, coderate: null, preambleLen: null,
        fixLen: null, payloadLen: null, crcOn: null, freqHopOn: null, hopPeriod: null, iqInverted: null, rxContinuous: null
    };

    var fskRadioPacketHandlerState = {
        preambleDetected: null, syncWordDetected: null, rssiValue: null, afcValue: null, rxGain: null,
        size: null, nbBytes: null, fifoThresh: null, chunkSize: null
    };

    var loraRadioPacketHandlerState = {
        snrValue: null, rssiValue: null, size: null
    };

    this.modemType = 0;
    this.radioState = 0;
    this.channel = 0;
    this.radioSettings = {};        // fskRadioSettings || loraRadioSettings
    this.packetHandlerState = {};   // fskRadioPacketHandlerState || loraRadioPacketHandlerState
    this._radioEvent = RADIO_EVENT.done;

    this.chipRevision = 0x12;
    this.FIFO_SIZE = 256;
    // differentiator between high and low bands
    this.RF_MID_BAND_THRESH = 525000000;

    // LoRa RSSI offsets depending on LF or HF bands
    this.LOR_RSSI_OFFSET_HF = -157;
    this.LOR_RSSI_OFFSET_LF = -164;

    this.onPacketSentISR = null;
    this.onrFifoLevelISR = null;
    this.onFifoFullISR = null;
    this.onFifoEmptyISR = null;
    this.onLowBatISR = null;
    this.onModeReadyISR = null;
};

Sx1276.prototype.readReg = function (address, callback) {
    // number
    // read a register
    // return number
    validateRegAddress(address);

    var _spi = this._spi,
        _cs = this._cs,
        outPkt = Buffer.alloc(2);

    outPkt[0] = (address &= 0x7f); // msb: 1(write), 0(read)
    outPkt[1] = 0x00;              // dummy data when reading

    _cs.on().then(function () {
        return _spi.write(outPkt);
    }).then(function (inPkt) {
        return _cs.off().then(function () {
            return inPkt[1];    // number
        });
    }).nodeify(callback);
};

Sx1276.prototype.writeReg = function (reg, val, callback) {
    // number, number
    // write to a register
    // return boolean
    validateRegAddress(address);
    validateRegValue(val);

    var _spi = this._spi,
        WRITE_MODE = 0x80,
        outPkt = Buffer.alloc(2);

    outPkt[0] = (address |= WRITE_MODE);   // msb: 1(write), 0(read)

    if (_.isNumber(val))
        outPkt[1] = val;    // will be auto transformed to an integer if it is a float number
    else if (_.isBuffer(val))
        outPkt[1] = val.readUInt8(0);

    _cs.on().then(function () {
        return _spi.write(outPkt);
    }).then(function (inPkt) {
        return _cs.off().then(function () {
            return true;
        });
    }).fail(function () {
        return false;
    }).nodeify(callback);
};

Sx1276.prototype.getChipVersion = function (callback) {
    //  
    // return the chip revision (usually 0x12)
    // return number
    return this.readReg(REG.VERSION).nodeify(callback);
};

Sx1276.prototype.reset = function () {
    //  
    // reset the modem
    //

    // void SX1276::reset()
    // {
    //   m_gpioReset.dir(mraa::DIR_OUT);
    //   usleep(1000); // 1ms
    //   m_gpioReset.dir(mraa::DIR_IN);
    //   usleep(10000); // 10ms
    // }
}

// void SX1276::readFifo(uint8_t *buffer, int len)
// {
//   uint8_t pkt = 0;

//   csOn();
//   if (m_spi.transfer(&pkt, NULL, 1))
//     {
//       csOff();
//       throw std::runtime_error(string(__FUNCTION__) +
//                                ": Spi.transfer(0) failed");
//       return;
//     }

//   if (m_spi.transfer(NULL, buffer, len))
//     {
//       csOff();
//       throw std::runtime_error(string(__FUNCTION__) +
//                                ": Spi.transfer(buf) failed");
//       return;
//     }
//   csOff();
// }

Sx1276.prototype.readFifo = function (buffer, len) {
    // uint8_t *, number
    // read the FIFO into a buffer
    // 
    if (len > FIFO_SIZE)
        throw new Error('Cannot read more than 256 bytes from FIFO');

    var outPkt = Buffer.alloc(1);

    // _cs.on().then(function () {
    //     return _spi.write(outPkt);
    // }).then(function (inPkt) {
    //     return _cs.off().then(function () {
    //         return true;
    //     });
    // }).fail(function () {
    //     return false;
    // }).nodeify(callback);

};

Sx1276.prototype.writeFifo = function (buffer  len) {
    // uint8_t *, number
    // write a buffer into the FIFO
    // 
};

Sx1276.prototype.setChannel = function (freq) {
    // number
    // Set the frequency to transmit and receive on
    // 
};

Sx1276.prototype.setOpMode = function (opMode) {
    // MODE_T(number)
    // Set the operating mode
    // 
};

Sx1276.prototype.setModem = function (modem) {
    // RADIO_MODEM_T(number)
    // Set the modem to access. This can be either the LORA or KSK/OOK modem.
    // 
};

Sx1276.prototype.setSleep = function () {
    // 
    // Place the SX1276 into sleep mode
    // 
};

Sx1276.prototype.setStandby = function () {
    // 
    // Place the SX1276 into standby mode
    // 
};

Sx1276.prototype.getRSSI = function (modem) {
    // RADIO_MODEM_T(number)
    // Return the current Received Signal Strength Indicator for the given modem
    // number
};

Sx1276.prototype.isChannelFree = function (modem, freq, rssiThresh) {
    // RADIO_MODEM_T, Number, Number(undefined)
    // Check to see if a given channel is free by comparing the RSSI to the supplied threshold.
    // Boolean
};

Sx1276.prototype.sendStr = function (buffer, timeout) {
    // String, Number(ms)
    // Send the supplied string. This writes the string into the FIFO and places the modem in transmit mode (via setTx()). This is a wrapper around send().
    // RADIO_EVENT_T
};

Sx1276.prototype.send = function (buffer, size, timeout) {
    // Uint8_t *, Number, Number(ms)
    // Send the supplied buffer. The writes the buffer into the FIFO and places the modem in transmit mode (via setTx()).
    // RADIO_EVENT_T
};

Sx1276.prototype.setRxConfig = function (modem, bandwidth, datarate, coderate, bandwidthAfc, preambleLen, symbTimeout, fixLen, payloadLen, crcOn, freqHopOn, hopPeriod, iqInverted, rxContinuous) {
    // modem: RADIO_MODEM_T
    // bandwidth: Number, The bandwidth to use. Valid values are FSK : >= 2600 and <= 250000 Hz LoRa: [125 kHz, 250 kHz, 500 kHz]
    // datarate: Number, Sets the Datarate FSK : 600..300000 bits/s LoRa: [6: 64, 7: 128, 8: 256, 9: 512, 10: 1024, 11: 2048, 12: 4096 chips]
    // coderate: Number, Sets the coding rate (LoRa only) FSK : N/A ( set to 0 ) LoRa: [1: 4/5, 2: 4/6, 3: 4/7, 4: 4/8]
    // bandwidthAfc: Number, Sets the AFC Bandwidth (FSK only) FSK : >= 2600 and <= 250000 Hz LoRa: N/A ( set to 0 )
    // preambleLen: Number, Sets the Preamble length FSK : Number of bytes LoRa: Length in symbols (the hardware adds 4 more symbols)
    // symbTimeout: Number, Sets the RxSingle timeout value (LoRa only) FSK : N/A ( set to 0 ) LoRa: timeout in symbols
    // fixLen: Boolean, Fixed length packets [false: variable, true: fixed]
    // payloadLen: Number, Sets payload length when fixed length is used
    // crcOn: Boolean, Enables/Disables the CRC [false: OFF, true: ON]
    // freqHopOn: Boolean, undefined
    // hopPeriod: Number, undefined
    // iqInverted: Boolean, Inverts IQ signals (LoRa only) FSK : N/A ( set to 0 ) LoRa: [false: not inverted, true: inverted]
    // rxContinuous: Boolean, Sets the reception in continuous mode [false: single mode, true: continuous mode]

    // Set the receive configuration for a modem. It is important that both the receive and transmit configurations match in order for communication to work between two radios.
};

Sx1276.prototype.setTxConfig = function (modem, power, fdev, bandwidth, datarate, coderate, preambleLen, fixLen, crcOn, freqHopOn, hopPeriod, iqInverted) {
    // modem: RADIO_MODEM_T
    // power: Number, Sets the output power [dBm]
    // fdev: Number, Sets the frequency deviation (FSK only) FSK : [Hz] LoRa: 0
    // bandwidth: Number, Sets the bandwidth (LoRa only) FSK : 0 LoRa: [125 kHz, 250 kHz, or 500 kHz]
    // datarate: Number, Sets the Datarate FSK : 600..300000 bits/s LoRa: [6: 64, 7: 128, 8: 256, 9: 512, 10: 1024, 11: 2048, 12: 4096 chips]
    // coderate: Number, Sets the coding rate (LoRa only) FSK : N/A ( set to 0 ) LoRa: [1: 4/5, 2: 4/6, 3: 4/7, 4: 4/8]
    // preambleLen: Number, Sets the preamble length FSK : Number of bytes LoRa: Length in symbols (the hardware adds 4 more symbols)
    // fixLen: Boolean, Fixed length packets [false: variable, true: fixed]
    // crcOn: Boolean, Enables disables the CRC [false: OFF, true: ON]
    // freqHopOn: Boolean, undefined
    // hopPeriod: Number, undefined
    // iqInverted: Boolean, Inverts IQ signals (LoRa only) FSK : N/A ( set to 0 ) LoRa: [false: not inverted, true: inverted]

    // Set the transmit configuration for a modem. It is important that both the receive and transmit configurations match in order for communication to work between two radios.
};

Sx1276.prototype.setRx = function (timeout) {
    // Number, The timeout in milliseconds
    // Start a receive operation. The method will return when completed, either successfully, or in error (crc, or other issue). If completed successfully, the returned buffer can be read via getRxBuffer() or getRxBufferStr() . In addition, values for RSSI and SNR (Lora only) can be retrieved.
    // RADIO_EVENT_T
};

Sx1276.prototype.getRxBufferStr = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet.
    // String: The received buffer in a std::string
};

Sx1276.prototype.getRxBuffer = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet.
    // Uint8_t *: a pointer to the received buffer. You can use getRxLen() to determine the number of valid bytes present.
};

Sx1276.prototype.getRxRSSI = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet's Received Signal Strength Indicator (RSSI) value.
    // Number: RSSI value
};

Sx1276.prototype.getRxSNR = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet's Signal to Noise (SNR) value.
    // Number: SNR value
};

Sx1276.prototype.getRxLen = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the number of bytes received.
    // Number: the number of bytes received
};


function validateRegAddress(address) {
    if (!_.isNumber(address))
        throw new TypeError('address should be a number.');
    else if (address < 0 || address > 255)
        throw new RangeError('address should be an integer in between 0 and 255.');
}

function validateRegValue(val) {
    if (_.isNumber(val)) {
        if (val > 255 || val < 0)
            throw new RangeError('val should be in between 0 to 255 if it is a number.');
    } else if (_.isBuffer(val)) {
        if (val.length !== 1)
            throw new Error('val should be a single byte to write out.');
    } else {
        throw new TypeError('data must be a number or a buffer');
    }
}

// private
this._lookupFSKBandWidth = function () {};


    // received data (on successful completion)
    volatile int m_rxRSSI;
    volatile int m_rxSNR;
    volatile int m_rxLen;
    uint8_t m_rxBuffer[FIFO_SIZE];

    // for coordinating interrupt access
    pthread_mutex_t m_intrLock;

    void lockIntrs() { pthread_mutex_lock(&m_intrLock); };
    void unlockIntrs() { pthread_mutex_unlock(&m_intrLock); };

    // timer support
    struct timeval m_startTime;
    void initClock();
    uint32_t getMillis();