# node_sx1276

*************************************************
### .init(callback)
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.init(function (err) {

});
```
  

*************************************************
### .reset(callback)
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.reset(function (err) {

});
```
  
*************************************************
### .isChannelFree(callback) - ok
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.isChannelFree(function (err) {

});
```

*************************************************
### .readChipVersion(callback) - ok
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.readChipVersion(function (err) {

});
```

*************************************************
### .readRssi(callback) - ok
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.readRssi(function (err) {

});
```

*************************************************
### .readSnr(callback)
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.readSnr(function (err) {

});
```

*************************************************
### .readFrequency(callback)
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.readFrequency(function (err) {

});
```

*************************************************
### .sleep(callback) - ok
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.sleep(function (err) {

});
```

*************************************************
### .standby(callback) - ok
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.standby(function (err) {

});
```

*************************************************
### .setOpMode(callback) - ok
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.setOpMode(function (err) {

});
```

*************************************************
### .useChannel(callback) - ok
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.useChannel(function (err) {

});
```

*************************************************
### .useModem(callback) - ok
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.useModem(function (err) {

});
```

*************************************************
### .readReg(regHdl[, callback]) - ok
Read value of a register by its handle `regHdl`, where `regHdl` can be an identifier (string) or an address (number).  
  

**Arguments:**  

1. `regHdl` (_String | Number_): Register handle.  
2. `callback` (_Function_): `function (err, val) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.readReg('COM.OpMode', function (err, val) {
    if (!err)
        console.log(val);   // 26
});
```

*************************************************
### .writeReg(regHdl, value[, callback]) - ok
Write the value to a register by its handle `regHdl`, where `regHdl` can be an identifier (string) or an address (number).  
  

**Arguments:**  

1. `regHdl` (_String | Number_)): Register handle.  
2. `value` (_Number_): The value to write to the register.  
3. `callback` (_Function_): `function (err) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.writeReg('COM.OpMod', 28, function (err) {
    if (!err)
        console.log('Written successful.');
});
```

*************************************************
### .read(regHdl, callback) - ok
Read value of a register by its handle `regHdl`, where `regHdl` can be an identifier (string) or an address (number). The read value will be an object if the value is coded in multi-fileds. 
  

**Arguments:**  

1. `callback` (_Function_): `function (err) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.read(function (err) {

});
```

*************************************************
### .write(callback) - ok
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.write(function (err) {

});
```

*************************************************
### .readFifo(callback)
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.readFifo(function (err) {

});
```

*************************************************
### .writeFifo(callback)
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.writeFifo(function (err) {

});
```

*************************************************
### .send(callback)
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.send(function (err) {

});
```

*************************************************
### .sendStr(callback)
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.sendStr(function (err) {

});
```

*************************************************
### .configTx(callback) - ok
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.configTx(function (err) {

});
```

*************************************************
### .configRx(callback)
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.configRx(function (err) {

});
```

*************************************************
### .startTx(callback)
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.startTx(function (err) {

});
```

*************************************************
### .startRx(callback)
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.startRx(function (err) {

});
```


*************************************************
### .startCad(callback) -- ok
TBD  
  

**Arguments:**  

1. `callback` (_Function_): `function (err, granted) {}`, will be called on 
  
**Returns:**  

* (_Promise_) 

**Examples:**  
  
```js
sx.startCad(function (err) {

});
```
