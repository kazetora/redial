var fs = require('fs');
var config = require('config');

var nodeconf = JSON.parse(
    fs.readFileSync('/opt/iotgw/nodeconfig.json')
);

var server = config.get('server_addr');
var port = config.get('server_port');
//console.log(nodeconf);
//console.log(server, port);

var cluster = require('cluster');

if (cluster.isMaster) {
    cluster.fork();

    cluster.on('exit', function(worker) {
        console.log("uncaught exception: restarting");
        setTimeout(function() {
           cluster.fork();
        }, 3000);
    });
}

else {
    var ClientWatcher = require('./client/clientWatcher.js');

    //var client_watcher = new ClientWatcher(nodeconf.node_id, server, port);
    var client_watcher = new ClientWatcher(nodeconf.name, server, port);

    var interval = 3000;

    setInterval(function() {
       client_watcher.checkConnection(false);
    }, interval);

    setInterval(function() {
      if(nodeconf.name.indexOf("gateway") === 0)
          client_watcher.getGPSACLGyro();
      else
          client_watcher.getGPSACL();
    }, 1000);

    process.on('uncaughtException', function(err){
        console.log(err);
        process.exit(1);
    });
}
