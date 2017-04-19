// spi: mode 0, 10000000 (10 MHz)
// cs: output, csOff(), csOn()
// reset: input (high-z)
// 10ms for POR
// ISR:
//    DIO0, input, rising edge, onDio0IRQ
//    DIO1, input, rising edge, onDio1IRQ
//    DIO2, input, rising edge, onDio2IRQ
//    DIO3, input, rising edge, onDio3IRQ
//    DIO4, input, rising edge, onDio4IRQ
//    DIO5, input, rising edge, onDio5IRQ

var REG = require('./constants/reg.js');

var MODEM_TYPE = { lora: 0, fsk: 1 };   // v
var RADIO_EVENT = { done: 0, exec: 1, error: 2, timeout: 3 };
var RADIO_STATE = { idle: 0, receiving: 1, tranmitting: 2, cad: 3 };    // v
var OPMODE = {
      Sleep                        : 0,
      Standby                      : 1,
      FSTX                         : 2, // freq synth
      TxMode                       : 3,
      FSRX                         : 4, // freq synth

      FSK_RxMode                   : 5,
      LOR_RxContinuous             : 5, // continuous rx mode

      FSK_Reserved6                : 6,
      LOR_RxSingle                 : 6, // single packet rx mode

      FSK_Reserved7                : 7,
      LOR_CAD                      : 7 // channel activity detection
};

function Sx1276(spi, cs, reset) {
    this.spi = spi;
    this.cs = cs;
    this.reset = reset;
    this.chipVersion = 0;   // [TODO]

    this.channel = null;

    this._fifoSize = 256;

    this.state = {
        opMode: 0,
        radio: 0,       // idle, receiving, transmitting, cad
        radioEvent: 0   // done, exec, error, timeout
    };

    this.startTime = now();

    this.state.radioEvent = TODO_REVENT_DONE;   // RaduiEvent.Done
    this.state.radio = TODO_STATE_IDLE;         // RadioState.Idle
    this.rxBuffer = new Buffer(this._fifoSize); // new Buffer(FIFO_SIZE)
    this.rxRSSI = 0;
    this.rxSNR = 0;

//--
    this._modems = {
        fsk: null,
        lora: null
    };
    this.modem = null;

    this.rxLen = null;

    this.intrLock = null;
    // void lockIntrs() { pthread_mutex_lock(&m_intrLock); };
    // void unlockIntrs() { pthread_mutex_unlock(&m_intrLock); };

    this.initClock = null;  // function
    this.getMillis = null;  // function

    this.onDio0Irq = null;
    this.onDio1Irq = null;
    this.onDio2Irq = null;
    this.onDio3Irq = null;
    this.onDio4Irq = null;
    this.onDio5Irq = null;

    // check the chip revision (to make sure we can read the regs properly)
    this.getChipVersion(function (cRev) {
        if (cRev !== chipVersion)
            self.emit('error', new Error('Incorrect Chip Revision. Expected 0x ')); // , got 0x"
    });

    this.init();
}

//######################################
Sx1276.prototype.init = function () {};
Sx1276.prototype.reset = function () {};
// Sx1276.prototype.isChannelFree = function () {};
// Sx1276.prototype.readChipVersion = function () {};
// Sx1276.prototype.readRssi = function () {};

Sx1276.prototype.readSnr = function () {};
Sx1276.prototype.readSnr = function () {};
Sx1276.prototype.readFrequency = function () {};

// Sx1276.prototype.sleep = function () {};
// Sx1276.prototype.standby = function () {};
// Sx1276.prototype.setOpMode = function () {};
// Sx1276.prototype.useChannel = function () {};
// Sx1276.prototype.useModem = function () {};

// Sx1276.prototype.readReg = function (reg, callback) {};
// Sx1276.prototype.writeReg = function () {};
// Sx1276.prototype.read = function (reg, callback) {};
// Sx1276.prototype.write = function () {};

Sx1276.prototype.readFifo = function () {};
Sx1276.prototype.writeFifo = function () {};
Sx1276.prototype.send = function () {};

Sx1276.prototype.sendStr = function ()  { return this.modem.sendStr();  };
// Sx1276.prototype.configTx = function () { return this.modem.configTx(); };
Sx1276.prototype.configRx = function () { return this.modem.configRx(); };
Sx1276.prototype.startTx = function ()  { return this.modem.startTx();  };
Sx1276.prototype.startRx = function ()  { return this.modem.startRx();  };
// Sx1276.prototype.startCad = function () { return this.modem.startCad(); };

//######################################

// OK
Sx1276.prototype.read = function (regHdl, callback) {
    return this.readReg(regHdl).then(function (val) {
        return REG.parseRegVal(regHdl, val);    // number or object
    }).nodeify(callback);
};

// OK
Sx1276.prototype.write = function (regHdl, data, callback) {
    var self = this;

    this.readReg(regHdl).then(function (val) {
        var rebuiltVal = REG.rebuildRegVal(regHdl, val, data);
        return self.writeReg(regHdl, rebuiltVal);
    }).nodeify(callback);
};

// OK
Sx1276.prototype.readReg = function (regHdl, callback) {
    // number, read a register, return number
    var self = this,
        addr = REG.addrToRead(regHdl),
        pkt = Buffer.alloc(2);

    pkt[0] = addr;
    pkt[1] = 0x00;  // dummy data while reading

    return Q.fcall(function () {
        if (addr === null)
            throw new TypeError('Bad register address: ' + regHdl);
        else
            return self.cs.on();
    }).then(function () {
        return self.spi.write(outPkt);
    }).then(function (inPkt) {
        return self.cs.off().then(function () {
            return inPkt[1];    // number
        });
    }).nodeify(callback);
};

// OK
Sx1276.prototype.writeReg = function (regHdl, val, callback) {
    // (number, number), write to a register, return boolean
    var self = this,
        addr = REG.addrToWrite(regHdl),
        outPkt = Buffer.alloc(2);

    outPkt[0] = addr;
    outPkt[1] = val;    // will be auto transformed to an integer if it is a float number

    return Q.fcall(function () {
        if (addr === null)
            throw new TypeError('Bad register address: ' + regHdl);
        else
            return self.cs.on();
    }).then(function () {
        return self.spi.write(outPkt);
    }).then(function () {
        return self.cs.off();
    }).then(function () {
        return true;
    }).nodeify(callback);
};

Sx1276.prototype.query = function (name, callback) {
    // name: version, rssi, frequecny, rxRssi, rxSnr, rxLen, isChannelFree
};

// OK
Sx1276.prototype.setChannel = function (freq, callback) {
    var self = this,
        freqDigits = (freq/TBD_FXOSC_STEP),
        freq = {
            msb: ((freqDigits >> 16) & 0xFF),
            mid: ((freqDigits >> 8) & 0xFF),
            lsb: (freqDigits & 0xFF)
        };

    return this.writeReg('COM.FrfMsb', freq.msb).then(function () {
        return self.writeReg('COM.FrfMid', freq.mid);
    }).then(function () {
        return self.writeReg('COM.FrfLsb', freq.lsb);
    }).then(function () {
        self.channel = freq;
        return freq;
    }).nodeify(callback);
};
//######################################

// [SEMI]
Sx1276.prototype.init = function (cfg, callback) {
    var self = this;
    // some initial setup
    var radioRegsInit = [
        { modemType: MODEM_FSK,  regName: 'COM.Lna',              value: 0x23 },
        { modemType: MODEM_FSK,  regName: 'FSK.RxConfig',         value: 0x1E },
        { modemType: MODEM_FSK,  regName: 'FSK.RssiConfg',        value: 0xD2 },
        { modemType: MODEM_FSK,  regName: 'FSK.PreambleDetect',   value: 0xAA },
        { modemType: MODEM_FSK,  regName: 'FSK.Osc',              value: 0x07 },
        { modemType: MODEM_FSK,  regName: 'FSK.SyncConfig',       value: 0x12 },
        { modemType: MODEM_FSK,  regName: 'FSK.SyncValue1',       value: 0xC1 },
        { modemType: MODEM_FSK,  regName: 'FSK.SyncValue2',       value: 0x94 },
        { modemType: MODEM_FSK,  regName: 'FSK.SyncValue3',       value: 0xC1 },
        { modemType: MODEM_FSK,  regName: 'FSK.PacketConfig1',    value: 0xD8 },
        { modemType: MODEM_FSK,  regName: 'FSK.FifoThresh',       value: 0x8F },
        { modemType: MODEM_FSK,  regName: 'FSK.ImageCal',         value: 0x02 },
        { modemType: MODEM_FSK,  regName: 'COM.DioMapping1',      value: 0x00 },
        { modemType: MODEM_FSK,  regName: 'COM.DioMapping2',      value: 0x30 },
        { modemType: MODEM_LORA, regName: 'LORA.MaxPayloadLength',value: 0x40 }
    ];

    var post = function () {
        self.reset().then(function () {
            return self.rxChainCalibration();
        }).then(function () {
            return self.setOpMode(TODO_MODE_Sleep);
        });
    };

    var seqCalls = [ post ];


    for (var i = 0; i < radioRegsInit.length; i++) {
        seqCalls.push(function () {
            return self.setModem(radioRegsInit[i].modemType).then(function () {
                return self.writeReg(radioRegsInit[i].regName, radioRegsInit[i].value);
            });
        });
    }

    seqCalls.push(function () {
        return self.setModem(MODEM_FSK).then(function () {
            self.state.radio = STATE_IDLE;
        });
    });

    seqCalls.reduce(function (soFar, f) {
        return soFar.then(f);
    }, Q(0)).fail(function (err) {
        deferred.reject(err);
    }).done(function () {
        deferred.resolve(bufLen);
    });

    return deferred.promise.nodeify(callback);
};

Sx1276.prototype.reset = function (callback) {

};

Sx1276.prototype.readFifo = function (buffer, len) {
    // uint8_t *, number
    // read the FIFO into a buffer
    // 
};
Sx1276.prototype.writeFifo = function (buffer, len) {};


// OK
Sx1276.prototype.setOpMode = function (mode, callback) {
    var self = this,
        deferred = Q.defer(),
        currentOpMode = this.state.opMode;

    if (currentOpMode === mode) {
        deferred.resolve();
        return deferred.promise.nodeify(callback);
    }

    // [TODO] if opMode to sleep => this.radio.idle

    this.write('COM.OpMode', { mode: mode }).then(function() {
        self.state.opMode = mode;
    }).done(deferred.resolve, deferred.reject);

    return deferred.promise.nodeify(callback);
};

//-- how to fallback
Sx1276.prototype.setModem = function (modemType, callback) {
    var self = this,
        currentModem = this.modem,
        modem = this._modems[modemType.toLowerCase()];

    return Q.fcall(function () {
        if (!modem)
            throw new TypeError('Bad modem type: ' + modemType);
    }).then(function () {
        return modem.enable();
    }).then(function () {
        self.modem = modem;
    }).fail(function (err) {
        self.modem = currentModem;
        return self.modem.enable(); // fall back
    }).nodeify(callback);
};

// ok
Sx1276.prototype.sleep = function (callback) {
    var self = this;

    return this.setOpMode(TODO_OPMODE.Sleep).then(function () {
        self.state.radio = TODO_RADIO_STATE.idle;
    }).nodeify(callback);
};

// ok
Sx1276.prototype.standby = function (callback) {
    var self = this;

    return this.setOpMode(TODO_OPMODE.Standby).then(function () {
        self.state.radio = RADIO_STATE.idle;
    }).nodeify(callback);
};


Sx1276.prototype.sendStr = function (str, timeout, callback) {
    // String, Number(ms)
    // Send the supplied string. This writes the string into the FIFO and places the modem in transmit mode (via setTx()). This is a wrapper around send().
    // RADIO_EVENT_T

    var deferred = Q.defer();

    if (str.length > this._fifoSize)
        deferred.reject(new Error('Buffer size must be less than ' + this._fifoSize));

    // for LORA/FSK modem, there seems to be a 64 byte requirement,
    // (LOR_RegRxNbBytes on the receiver) never seems to be anything
    // other than 64. Same seems to go for the FSK modem.  So, if the
    // packet is less than 64, pad it out to 64 bytes.  This requires
    // investigation.

    if (str.length < 64) {
        // padding to 64 bytes
    }

    // [TODO]

    this.send();

  return send((uint8_t *)buffer.c_str(), buffer.size(), timeout);

    return deferred.promise.nodeify(callback);

};

Sx1276.prototype.send = function (buffer, size, timeout, callback) {
    // Uint8_t *, Number, Number(ms)
    // Send the supplied buffer. The writes the buffer into the FIFO and places the modem in transmit mode (via setTx()).
    // RADIO_EVENT_T
    return this.modem.send();
};


Sx1276.prototype.setTx = function (timeout, callback) {};

Sx1276.prototype.setRx = function (timeout) {
    // Number, The timeout in milliseconds
    // Start a receive operation. The method will return when completed, either successfully, or in error (crc, or other issue). If completed successfully, the returned buffer can be read via getRxBuffer() or getRxBufferStr() . In addition, values for RSSI and SNR (Lora only) can be retrieved.
    // RADIO_EVENT_T
};

Sx1276.prototype.configTx = function (config) {   // modem, power, fdev, bandwidth, datarate, coderate, preambleLen, fixLen, crcOn, freqHopOn, hopPeriod, iqInverted
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

    var self = this,
        paConfig, paDac;

    this.read('COM.PaConfig').then(function (paCfg) {
        paConfig = paCfg;   // { paSelect, maxPower, outputPower }

        paConfig.paSelect = 0;    // default 0, +14dBm
        paConfig.maxPower = 7;

        if (self.channel < TODO_RF_MID_BAND_THRESH)
            paConfig.paSelect = 1;    // 1, +20dBm

        return self.read('COM.paDac');
    }).then(function (dac) {
        paDac = dac;    // { reserved, paDac }

        if (paConfig.paSelect) {
            paDac.paDac = (config.power > 17) ? TODO_PADAC_BOOST : TODO_PADAC_DEFAULT;
            // TODO_PADAC_BOOST; // 7, +20dBm on PA_BOOST when OuputPower = 1111
            // TODO_PADAC_DEFAULT; // 4
        }

        return paConfig.paSelect;
    }).then(function (pa) {
        if (pa === 0)
            return pa;  // low power mode, set at next then

        if (paDac.paDac === TODO_PADAC_BOOST) {
            config.power = (config.power < 5) ? 5 : config.power;
            config.power = (config.power > 20) ? 20 : config.power;

            paConfig.outputPower = (config.power - 5);
        } else {
            config.power = (config.power < 2) ? 2 : config.power;
            config.power = (config.power > 17) ? 17 : config.power;
            paConfig.outputPower = (config.power - 2);
        }
        return pa;
    }).then(function (pa) {
        if (pa !== 0)
            return; 

        config.power = (config.power < -1 ? -1 : config.power;
        config.power = (config.power > 14 ? 14 : config.power;
        paConfig.outputPower = (config.power + 1);
    }).then(function () {
        return self.write('COM.PaConfig', paConfig);
    }).then(function () {
        return self.write('COM.PaDac', paDac);
    }).then(function () {
        return self.modem.configTx(config);
    }).nodeify(callback);
};

Sx1276.prototype.configRx = function (modem, bandwidth, datarate, coderate, bandwidthAfc, preambleLen, symbTimeout, fixLen, payloadLen, crcOn, freqHopOn, hopPeriod, iqInverted, rxContinuous) {
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

Sx1276.prototype.getRxBufferStr = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet.
    // String: The received buffer in a std::string
};

Sx1276.prototype.getRxBuffer = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet.
    // Uint8_t *: a pointer to the received buffer. You can use getRxLen() to determine the number of valid bytes present.
    return (uint8_t*)m_rxBuffer;
};



Sx1276.prototype.runImageCalibration = function (callback) {
    return self.readReg('FSK.ImageCal').then(function (regVal) {
        reg = regVal;
        return self.writeReg('FSK.ImageCal', reg | TODO_IMAGECAL_ImageCalStart);
    }).nodeify(callback);

  // spin until complete
  while (readReg('FSK.ImageCal') & IMAGECAL_ImageCalRunning)
    usleep(1);

};

Sx1276.prototype.rxChainCalibration = function (callback) {
    var self = this,
        regPaConfigInitVal,
        initialFreq,
        reg;

    // this function should only be called in init() (after reset()), as
    // the device is configured for FSK mode, LF at that time.

    // Save context
    this.readReg('COM.PaConfig').then(function (regVal) {
        return regPaConfigInitVal = regVal;
    }).then(function () {
        return self.readFrequncy();
    }).then(function () {
        // Cut the PA just in case, RFO output, power = -1 dBm
        return self.writeReg('COM.PaConfig', 0);
    }).then(function () {
        // Launch Rx chain calibration for LF band
        return self.runImageCalibration();
    }).then(function () {
        // Set a Frequency in HF band
        return self.setChannel(868000000);
    }).then(function () {
        // Launch Rx chain calibration for HF band 
        return self.runImageCalibration();
    }).then(function () {
        // Restore context
        return self.writeReg('COM.PaConfig', regPaConfigInitVal);
    }).then(function () {
        return self.setChannel(initialFreq);
    }).nodeify(callback);
};

Sx1276.prototype.lookupFSKBandWidth = function (bw) {
    // This function looks up values in the fsk_bw_lookup_table and
    // returns the approprite register value to use for either the
    // FSK_RxBw or the FSK_RegAfcBw registers

    // See Table 40 in the datasheet
    var reg;

    FskBandwidths.forEach(function (rec) {
        if (!reg && bw >= rec.bandwidth) {
            reg = rec.value;
        }
    });

    return reg;
};

// init();
// startCAD();
// setMaxPayloadLength();
// csOn();
// csOff();

// lockIntrs();
// unlockIntrs();
// initClock();
// getMillis();

// ISRs
// static void onDio0Irq(void *ctx);
// static void onDio1Irq(void *ctx);
// static void onDio2Irq(void *ctx);
// static void onDio3Irq(void *ctx);
// static void onDio4Irq(void *ctx);
// static void onDio5Irq(void *ctx);


/*************************************************************************************************/
/*** Protected Prototype Methods                                                               ***/
/*************************************************************************************************/
// OK
Sx1276.prototype.readChipVersion = function (callback) {
    return this.readReg('COM.Version').nodeify(callback);
};

// ok
Sx1276.prototype.readRssi = function (callback) {
    return this.modem.readRssi().nodeify(callback);
};

// OK
Sx1276.prototype.readFrequncy = function (callback) {
    var freq = { msb: null, mid: null, lsb: null };

    return self.readReg('COM.FrfMsb').then(function (fmsb) {
        freq.msb = fmsb;
        return self.readReg('COM.FrfMid');
    }).then(function (fmid) {
        freq.mid = fmid;
        return self.readReg('COM.FrfLsb');
    }).then(function (flsb) {
        freq.lsb = flsb;
        return ((freq.msb << 16) | (freq.mid << 8) | freq.lsb) * TODO_FXOSC_STEP;
    }).nodeify(callback);
};

// ok
Sx1276.prototype.isChannelFree = function (freq, rssiThresh, callback) {
    var self = this;

    return this.useChannel(freq).then(function () {
        return self.setOpMode(TODO_OPMODE_FSK_RxMode);
    }).delay(1).then(function () {
        return self.readRssi();
    }).then(function (rssi) {
        self.sleep();
        return rssi;
    }).then(function (rssi) {
        return (rssi > rssiThresh);
    }).nodeify(callback);
};

Sx1276.prototype.getRxRSSI = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet's Received Signal Strength Indicator (RSSI) value.
    // Number: RSSI value
    return m_rxRSSI;
};

Sx1276.prototype.getRxSNR = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the received packet's Signal to Noise (SNR) value.
    // Number: SNR value
    return m_rxSNR;
};

Sx1276.prototype.getRxLen = function () {
    // 
    // Upon a successful receive, this method can be used to retrieve the number of bytes received.
    // Number: the number of bytes received
};