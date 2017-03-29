var fsk = {};

var radioSettings = {
    power: null,
    fdev: null,
    bandwidth: null,
    bandwidthAfc: null,
    datarate: null,
    preambleLen: null,
    fixLen: null,
    payloadLen: null,
    crcOn: null,
    iqInverted: null,
    rxContinuous: null
};

var fskRadioPacketHandlerState = {
    preambleDetected: null,
    syncWordDetected: null,
    rssiValue: null,
    afcValue: null,
    rxGain: null,
    size: null,
    nbBytes: null,
    fifoThresh: null,
    chunkSize: null
};


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

fsk.send = function () {
    
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

fsk.setRxConfig = function () {
    
};

fsk.setTxConfig = function () {
    
};

fsk.startCAD = function () {
    return; // do nothing
};

fsk.setMaxPayloadLength = function () {
    if (!modem.settings.fixLen)
        return this.setModem(modemType).writeReg(FSK_REG.PayloadLength, max);
};