var lora = {};

lora.use = function () {
    var self = this;
    this.setOpMode(OPMODE.Sleep).then(function () {
            return self.readReg(REG.OpMode);
    }).then(function (currentBits) {
        return currentBits & ~OPMODE_LongRangeMode; // turn off lora
    }).then(function (newBits) {
        return self.writeReg(REG.OpMode, newBits);
    }).then(function () {
        return self.writeReg(REG.DioMapping1, 0x00);
    }).then(function () {
        return self.writeReg(REG.DioMapping2, 0x30);    // DIO5=ModeReady
    }).then(function () {
        self.modemType = modemType;
    }).done(deferred.resolve, deferred.reject);
};

lora.readRssi = function () {
    return this.readReg(REG_LORA.RssiValue).done(function (rssiOffset) {

        if (self.channel > RF_MID_BAND_THRESH)
            rssi = LORA_RSSI_OFFSET_HF + rssiOffset;
        else
            rssi = LORA_RSSI_OFFSET_LF + rssiOffset;

        return rssi;
    }).done(deferred.resolve, deferred.reject);
};

lora.send = function () {

};

lora.setTx = function () {
    
};

lora.setRx = function () {
    
};

lora.setRxConfig = function () {
    
};

lora.setTxConfig = function () {
    
};

lora.startCAD = function () {
    
};

lora.setMaxPayloadLength = function () {
    
};