function Modem(type, settings) {
    this.type = type;
    this.settings = settings;

    // should be implmented
    this.enable = null;
    this.disable = null;
    this.readRssi = null;
    this.send = null;
    this.setTx = null;
    this.setRx = null;
    this.setTxConfig = null;
    this.setRxConfig = null;
    this.startCAD = null;
    this.setMaxPayloadLength = null;
}

module.exports = Modem;

