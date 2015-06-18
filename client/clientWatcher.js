require('https').globalAgent.options.rejectUnauthorized = false;
var io = require("socket.io-client");

function ClientWatcher(nodeId, server, port) {
    this.nodeId = nodeId;
    this.server_addr = server;
    this.server_port = port;
    this.API_SERVER = "https://" + server +":" + port + "/";
    this.WS_SERVER = "https://" + server +":" + port + "/";
    this.dialing = false;
    this.socket = null;
    this.socketConnected = false;
    this.reqNotif = false;
    this.init();
}

ClientWatcher.prototype.init = function() {
    var _self = this;
    _self.connectSocket();
    _self.checkConnection(true);
};

ClientWatcher.prototype.connectSocket = function() {
    var _self = this;
    _self.socket = null;
    var socketOptions = {
        "secure": true,
        "transports": [ "websocket" ],
        "try multiple transports": false,
        "reconnect": false,
        "force new connection": true,
        "connect timeout": 10000
    };

    try {
       _self.socket = io.connect(_self.WS_SERVER, socketOptions);//("http://"+_self.server_addr+":"+_self.server_port);
    } catch (ex) {
       _self.reconnectSocket();
    }
    //_self.socket = io.connect("ws://localhost:12345", socketOptions);

    _self.socket.on("connect", function() {
        console.log("Connected");
        _self.socketConnected = true;
        //socket.emit("update_complete");
        //socket.on("update_received", function(){
        //    console.log("update received");
        //    socket.disconnect();
        //});
    });

    _self.socket.on('error', function(err) {
        console.log(err);
        _self.socketConnected = false;
        _self.reconnectSocket();
    });

    _self.socket.on('connect_failed', function() {
        console.log("connection failed");
        _self.socketConnected = false;
        _self.reconnectSocket();
    });

    _self.socket.on('disconnect', function() {
        console.log("disconnected");
        _self.socketConnected = false;
        _self.reconnectSocket();
    });
};

ClientWatcher.prototype.reconnectSocket = function() {
    var _self = this;
    if(_self.socket)
        _self.socket.removeAllListeners();
    console.log(_self.WS_SERVER);
    setTimeout(_self.connectSocket.bind(_self), 3000);
}

ClientWatcher.prototype.getInterfaceAddress = function (ifname) {
    var os = require('os');
    var net_iface = os.networkInterfaces();
    if (ifname in net_iface) {
        for(var i in net_iface[ifname]) {
            var address = net_iface[ifname][i];
            if(address.family === 'IPv4' && !address.internal)
                return address.address;
        }
    }
    else
        return null;
};

ClientWatcher.prototype.checkConnection = function(force) {
    var _self = this;
    var ppp0_addr = _self.getInterfaceAddress('ppp0');
    if (ppp0_addr == null){
        _self.dialing = true;
        console.log("ppp0 is down. Redialing now");
        var cp = require('child_process');
        var cmd = cp.spawn('/usr/bin/wvdial', [], {
            detached: true,
            stdio: ['ignore', 'ignore', 'ignore']
        });
        cmd.unref();
    }
    else {
        if(force || _self.dialing){
            _self.dialing = false;
            _self.updateNodeInfo(ppp0_addr);
        }
    }
};

ClientWatcher.prototype.checkConnection2 = function(force) {
    var _self = this;
    
    var ppp0_addr = _self.getInterfaceAddress('ppp0');
    if (ppp0_addr == null){
        _self.dialing = true;
        console.log("ppp0 is down. Redialing now");
        var cp = require('child_process');
        var cmd = cp.spawn('wvdial', []);
    }
    else {
        if(force || _self.dialing || reqNotif){
            _self.updateNodeInfo(ppp0_addr);
        }
    }
}

ClientWatcher.prototype.updateNodeInfo = function(addr) {
    var _self = this;
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var args = {
        data: { 
            id: _self.nodeId,
            ip: addr
        },
        headers: {
            "Content-Type": "application/json"
        }
    };
    
    try {
        client.registerMethod("updateNodeInfo", _self.API_SERVER + "nodes/updateNodeIP", "POST");
        client.methods.updateNodeInfo(args, function (data, response) {
            //console.dir(data);
            //console.log(response);
            if(_self.socketConnected) {
                _self.reqNotif = false;
                _self.dialing = false;
                _self.socket.emit("update_complete");
            }
            else {
                console.log("Exception caught. Require notification later");
                _self.reqNotif = true;
            }
        });
     } catch (ex){
         _self.reqNotif = true;
     }
};

module.exports = ClientWatcher;

var run = function(){
    var server = "192.168.110.131", port = 3000;
    var client = new ClientWatcher('V1ZpVN7U', server, port);
    var interval = 3000;


    setInterval(function() {
        client.checkConnection(false);
    }, interval);
}

if(require.main === module) {
    run()
}

