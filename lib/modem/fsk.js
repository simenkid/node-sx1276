var fsk = {
    chip: null,             // holds the sx1276 instance
    settings: {
        power: null,        // number
        fdev: null,         // number
        bandwidth: null,    // number
        bandwidthAfc: null, // number
        datarate: null,     // number
        preambleLen: null,  // number
        fixLen: null,       // bool
        payloadLen: null,   // number
        crcOn: null,        // bool
        iqInverted: null,   // bool
        rxContinuous: null  // bool
    },
    packetState: {
        preambleDetected: null,
        syncWordDetected: null,
        rssiValue: null,
        afcValue: null,
        rxGain: null,
        size: null,
        nbBytes: null,
        fifoThresh: null,
        chunkSize: null
    }
};

//--
fsk.send = function (buf, size, timeout, callback) {
    var self = this,
        chip = this.chip;

    this.packetState.nbBytes = 0;
    this.packetState.size = 0;

    if (!this.settings.fixLen)
        chip.writeFifo(size, 1);
    else
        chip.writeReg(REG.FSK.PayloadLength, size);

    if (size > 0 && size <= 64)
        this.packetState.chunkSize = 32;

    // Write payload buffer
    chip.writeFifo(buf, this.packetState.chunkSize).then(function () {
        self.packetState.nbBytes += self.packetState.chunkSize;
    });
};

fsk.setRxConfig = function (config) {
    // config = {
    //     bandwidth: null,    // number
    //     bandwidthAfc: null, // number
    //     datarate: null,     // number
    //     coderate: null,     // number
    //     preambleLen: null,  // number
    //     symbTimeout: null,  // number
    //     fixLen: null,       // bool
    //     payloadLen: null,   // number
    //     crcOn: null,        // bool
    //     freqHopOn: null,    // bool
    //     hopPeriod: null,    // number
    //     iqInverted: null,   // bool
    //     rxContinuous: null  // bool
    // };

    var reg,
        self = this,
        chip = this.chip,
        settings = this.settings;

    settings.bandwidth = config.bandwidth,          // number
    settings.bandwidthAfc = config.bandwidthAfc,    // number
    settings.datarate = config.datarate,            // number
    settings.preambleLen = config.preambleLen,      // number
    settings.fixLen = config.fixLen,                // bool
    settings.payloadLen = config.payloadLen,        // number
    settings.crcOn = config.crcOn,                  // bool
    settings.iqInverted = config.iqInverted,        // bool
    settings.rxContinuous = config.rxContinuous     // bool

    var dataRate = Math.round(TODO_FXOSC_FREQ/config.datarate); // To integer

    this.setBitRate(dataRate).then(function () {
        return self.writeReg(REG.FSK.RxBw,lookupFSKBandwidth(settings.bandwidth));
    }).then(function () {
        return self.writeReg(REG.FSK.AfcBw,lookupFSKBandwidth(settings.bandwidthAfc));
    }).then(function () {
        return self.setPreambleLen();
    }).then(function () {
        if (settings.fixLen)
            return self.writeReg(REG.FSK.PayloadLength, settings.payloadLen);
        else
            return true;
    }).then(function () {
        return self.readReg('FSK.PacketConfig1');
    }).then(function (cfg1) {
        // reg = readReg(FSK_RegPacketConfig1);
        // reg &= ~(PACKETCONFIG1_CrcOn | PACKETCONFIG1_PacketFormat);

        // if (!fixLen)
        //   reg |= PACKETCONFIG1_PacketFormat; // variable len
        
        // if (crcOn)
        //   reg |= PACKETCONFIG1_CrcOn;

        // writeReg(FSK_RegPacketConfig1, reg);
    });

    // settings.coderate: null,     // number
    // settings.symbTimeout: null,  // number
    // settings.freqHopOn: null,    // bool
    // settings.hopPeriod: null,    // number
};

fsk.setBitRate = function (datarate, callback) {
    var self = this,
        chip = this.chip;

    return chip.writeReg(REG.FSK.BitrateMsb, (datarate >> 8) & 0xFF).then(function () {
        return chip.writeReg(REG.FSK.BitrateLsb, (datarate & 0xFF));
    }).nodeify(callback);
};

fsk.setPreambleLen = function (preambleLen, callback) {
    var self = this,
        chip = this.chip;

    return chip.writeReg(REG.FSK.PreambleMsb, (preambleLen >> 8) & 0xFF).then(function () {
        return chip.writeReg(REG.FSK.PreambleLsb, (preambleLen & 0xFF));
    }).nodeify(callback);
};





//------------------------------------------------------
fsk.use = function () {
    this.setOpMode(OPMODE.Sleep).then(function () {
        return self.readReg(REG.OpMode);
    }).then(function (currentBits) {
        return currentBits | OPMODE_LongRangeMode; // turn lora on
    }).then(function (newBits) {
        return self.writeReg(REG.OpMode, newBits);
    }).then(function () {
        return self.writeReg(REG.DioMapping1, 0x00);
    }).then(function () {
        return self.writeReg(REG.DioMapping2, 0x00);
    }).then(function () {
        self.modemType = modemType;
    }).done(deferred.resolve, deferred.reject);
};

fsk.readRssi = function () {
    return this.readReg(REG_FSK.RssiValue).then(function (rssix2) {
        return rssix2/2;
    }).done(deferred.resolve, deferred.reject);
};

fsk.setTx = function (timeout) {
  uint8_t reg = 0;

        // DIO0=PacketSent
        // DIO1=FifoLevel
        // DIO2=FifoFull
        // DIO3=FifoEmpty
        // DIO4=LowBat
        // DIO5=ModeReady

        reg = readReg(COM_RegDioMapping1);
        reg &= ~( (DOIMAPPING1_Dio0Mapping_MASK << 
                   DOIMAPPING1_Dio0Mapping_SHIFT) |
                  (DOIMAPPING1_Dio2Mapping_MASK << 
                   DOIMAPPING1_Dio2Mapping_SHIFT) );

        writeReg(COM_RegDioMapping1, reg);


        reg = readReg(COM_RegDioMapping2);
        reg &= ~( (DOIMAPPING2_Dio4Mapping_MASK << 
                   DOIMAPPING2_Dio4Mapping_SHIFT) |
                  (DOIMAPPING2_Dio5Mapping_MASK << 
                   DOIMAPPING2_Dio5Mapping_SHIFT) );

        writeReg(COM_RegDioMapping2, reg);

        m_settings.fskPacketHandler.FifoThresh = 
          (readReg(FSK_RegFifoThresh) & 
           (_FIFOTHRESH_FifoThreshold_MASK << _FIFOTHRESH_FifoThreshold_SHIFT));

  m_settings.state = STATE_TX_RUNNING;
  m_radioEvent = REVENT_EXEC;

  setOpMode(MODE_TxMode);

  initClock();
  while ((getMillis() < static_cast<uint32_t>(timeout)) && m_radioEvent == REVENT_EXEC)
    usleep(100);

  if (m_radioEvent == REVENT_EXEC)
    {
      // timeout
      m_radioEvent = REVENT_TIMEOUT;
    }

  return m_radioEvent;
};

fsk.setRx = function (timeout) {
  bool rxContinuous = false;
  uint8_t reg = 0;

        rxContinuous = m_settings.fskSettings.RxContinuous;
            
        // DIO0=PayloadReady
        // DIO1=FifoLevel
        // DIO2=SyncAddr
        // DIO3=FifoEmpty
        // DIO4=Preamble
        // DIO5=ModeReady
        reg = readReg(COM_RegDioMapping1);
        reg &= ~( (DOIMAPPING1_Dio0Mapping_MASK << 
                   DOIMAPPING1_Dio0Mapping_SHIFT) |
                  (DOIMAPPING1_Dio2Mapping_MASK << 
                   DOIMAPPING1_Dio2Mapping_SHIFT) );
        reg |= ( (DIOMAPPING_00 << DOIMAPPING1_Dio0Mapping_SHIFT) |
                 (DIOMAPPING_11 << DOIMAPPING1_Dio2Mapping_SHIFT) );
        writeReg(COM_RegDioMapping1, reg);

            
        reg = readReg(COM_RegDioMapping2);
        reg &= ~( (DOIMAPPING2_Dio4Mapping_MASK << 
                   DOIMAPPING2_Dio4Mapping_SHIFT) |
                  (DOIMAPPING2_Dio5Mapping_MASK << 
                   DOIMAPPING2_Dio5Mapping_SHIFT) );
        reg |= (DIOMAPPING_11 << DOIMAPPING2_Dio4Mapping_SHIFT) |
          DOIMAPPING2_MapPreambleDetect;

        writeReg(COM_RegDioMapping2, reg);

        m_settings.fskPacketHandler.FifoThresh = 
          (readReg(FSK_RegFifoThresh) & _FIFOTHRESH_FifoThreshold_MASK);
            
        m_settings.fskPacketHandler.PreambleDetected = false;
        m_settings.fskPacketHandler.SyncWordDetected = false;
        m_settings.fskPacketHandler.NbBytes = 0;
        m_settings.fskPacketHandler.Size = 0;

  memset(m_rxBuffer, 0, FIFO_SIZE);

  m_settings.state = STATE_RX_RUNNING;
  m_radioEvent = REVENT_EXEC;

      setOpMode(MODE_FSK_RxMode);

  initClock();
  while ((getMillis() < timeout) && m_radioEvent == REVENT_EXEC)
    usleep(100);

  if (m_radioEvent == REVENT_EXEC)
    {
      // timeout
      m_radioEvent = REVENT_TIMEOUT;
    }

  return m_radioEvent;
};



fsk.setTxConfig = function (config) {
    // config = {
    //     power,
    //     fdev,
    //     bandwidth,
    //     datarate,
    //     coderate,
    //     preambleLen,
    //     fixLen,
    //     crcOn,
    //     freqHopOn,
    //     hopPeriod,
    //     iqInverted
    // };
};

fsk.startCAD = function () {
    return; // do nothing
};

fsk.setMaxPayloadLength = function () {
    if (!modem.settings.fixLen)
        return this.setModem(modemType).writeReg(FSK_REG.PayloadLength, max);
};

