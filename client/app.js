var fs = require('fs');
var config = require('config');

var nodeconf = JSON.parse(
    fs.readFileSync('/opt/iotgw/nodeconfig.json')
);

var server = config.get('server_addr');
var port = config.get('server_port');
//console.log(nodeconf);
//console.log(server, port);

var ClientWatcher = require('./clientWatcher.js');

var client_watcher = new ClientWatcher(nodeconf.node_id, server, port);

var interval = 3000;

setInterval(function() {
    client_watcher.checkConnection(false);
}, interval);

