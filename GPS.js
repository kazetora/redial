function GPS(params) {
  this.serial_port = "/dev/ttyMFD1";
  this.serial_baudrate = 9600;
  this.serial_readline = "\r\n";
  this.init(params);
}

GPS.prototype.init = function(params) {
  if(typeof params !== 'undefined'){
    if (typeof params['serial_port'] != 'undefined'){
      this.serial_port = params['serial_port'];
    }
    if (typeof params['serial_baudrate'] != 'undefined'){
      this.serial_port = params['serial_baudrate'];
    }
    if (typeof params['serial_readline'] != 'undefined'){
      this.serial_port = params['serial_readline'];
    }
  }
}

GPS.prototype.getGPSInfo = function(onSuccess, onErr) {
  var _self = this;
  var com = require("serialport");

  var serialPort = new com.SerialPort(_self.serial_port, {
    baudrate: parseInt(_self.serial_baudrate),
    parser: com.parsers.readline(_self.serial_readline)
  });

  serialPort.on('open', function(err) {
    console.log('serialPort: Port open');
  });

  serialPort.on('close', function(err) {
    if(err) {
        console.log(err.stack);
    }
    console.log('serialPort: Port close');
  });

  serialPort.on('data', function(data) {
    try{
      //console.log("Data ready");
      var nmea = require("nmea-0183");
      var gps = nmea.parse(data);
      //console.dir(gps);
      if(gps['id'] == 'GPRMC') {
        console.log('GPRMC');
        //console.log(gps);
        onSuccess(gps);
        serialPort.close();
      }
    } catch(e) {
      //console.log(e);
      serialPort.close();
      onErr(e);
    }
  });
}

module.exports = GPS;

var test = function() {
  var gps = new GPS();
  gps.getGPSInfo(function(data) {
    console.log(data);
  }, function(err){
    console.log(err);
  });
};

if(require.main === module) {
    test();
}

