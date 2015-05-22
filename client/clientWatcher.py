#!/usr/bin/python

import os
import socket
import fcntl
import struct
import array

class ClientWatcher:
    def __init__(self, nodeId):
        self.nodeId = nodeId
        ifs = self.all_interfaces()
        self.interfaces = []
        for i in ifs:
            ifobj = {'name': i , 'address': self.get_ip_address(i)}
            self.interfaces.append(ifobj)
    
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
        for i in self.interfaces:
            print i['name'] + ' ' + i['address']

if __name__ == "__main__":
    cw = ClientWatcher(1)
    found = False
    for i in cw.interfaces:
        if i['name'] == 'ppp0':
            found = True
            break

    if not found:
        os.system("wvdial &")

    cw.print_interfaces()
