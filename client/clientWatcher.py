#!/usr/bin/python

import os
import socket
import fcntl
import struct
import array
import xmlrpclib
import urllib
import urllib2
import time
from socketIO_client import SocketIO, LoggingNamespace

class ClientWatcher:
    def __init__(self, nodeId, serveraddr, serverport):
        self.nodeId = nodeId
        self.server_addr = serveraddr
        self.server_port = serverport
        #self.updated = False
        self.dialing = False
        self.connected = False
        self.API_SERVER = "http://%s:%d" % (self.server_addr, self.server_port)
        self.WS_SERVER = "ws://%s:%d/socket.io/1/websocket" % (self.server_addr, self.server_port)
        found = False
        for i in self.all_interfaces():
            if i == "ppp0":
                found = True
                break
        if found:
            #proxy = xmlrpclib.ServerProxy("http://%s:%d/" % (self.server_addr, self.server_port))
            #ret = proxy.updateClientList(self.nodeId, self.get_ip_address("ppp0"))
            print "update client" 
            self.updateNodeIP(self.get_ip_address("ppp0"))
            

    def get_ip_address(self, ifname):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        return socket.inet_ntoa(fcntl.ioctl(
            s.fileno(),
            0x8915,
            struct.pack('256s', ifname[:15])
        )[20:24])

    def all_interfaces(self):
        max_possible = 128
        bytes = max_possible * 32
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        names = array.array('B', '\0' * bytes)
        outbytes = struct.unpack('iL', fcntl.ioctl(
            s.fileno(),
            0x8912,
            struct.pack('iL', bytes, names.buffer_info()[0])
        ))[0]
        namestr = names.tostring()
        return [namestr[i:i+32].split('\0', 1)[0] for i in range(0, outbytes, 32)]    

    def print_interfaces(self):
        for i in self.all_interfaces():
            print i + ' ' + self.get_ip_address(i)

    def updateClientInfo(self):
        found = False
        for i in self.all_interfaces():
            if i == 'ppp0':
                found = True
                break
        if not found:
            print "ppp0 is down. redialing now"
            self.dialing = True
            os.system("wvdial > /dev/null &")
            time.sleep(5)
        else:
            if self.dialing:
                self.dialing = False
                print "updating client info"
                #proxy = xmlrpclib.ServerProxy("http://%s:%d/" % (self.server_addr, self.server_port))
                #ret = proxy.updateClientList(self.nodeId, self.get_ip_address("ppp0"))
                #print "update client: %s" % ret
                self.updateNodeIP(self.get_ip_address("ppp0"))

    def updateNodeIP(self, ip):
        url = "%s/nodes/updateNodeIP/" % self.API_SERVER
        print url
        params = urllib.urlencode({
             'id': self.nodeId,
             'ip': ip
        })
        print params
        req = urllib2.Request(url)
        req.add_data(params)
        response = urllib2.urlopen(req).read()
        print "response: %s" % response
        self.sendUpdateCompleteMessage()


    def sendUpdateCompleteMessage(self):
        with SocketIO(self.server_addr, self.server_port, LoggingNamespace) as socketIO:
            socketIO.emit('update_complete')
            socketIO.wait(seconds=1)
        

if __name__ == "__main__":
    cw = ClientWatcher("4JbCfm9S", "192.168.110.131", 3000)
    while True:
        cw.updateClientInfo()
        time.sleep(1)
