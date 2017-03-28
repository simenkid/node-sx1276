var fsk = {};

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

fsk.setTx = function () {
    
};

fsk.setRx = function () {
    
};

fsk.setRxConfig = function () {
    
};

fsk.setTxConfig = function () {
    
};

fsk.startCAD = function () {
    
};

fsk.setMaxPayloadLength = function () {
    
};