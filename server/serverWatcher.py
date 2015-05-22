#!/usr/bin/python

import xmlrpclib
from SimpleXMLRPCServer import SimpleXMLRPCServer

class ServerWatcher:
    def __init__(self, port):
        self.clientList = []
        self.server = SimpleXMLRPCServer(("0.0.0.0", port))
        self.server.register_function(self.updateClientList, "updateClientList")
        self.server.register_function(self.getClientList, "getClientList")

    def updateClientList(self, client_id, address):
        existing = False
        for c in self.clientList:
            if c['client_id'] == client_id:
                print "update client %d ip address: %s" % (client_id, address)
                c['address'] = address
                existing = True
                break
        
        if not existing:
            print "add new client id %d with ip address: %s" %(client_id, address)
            self.clientList.append({
                              'client_id': client_id,
                              'address': address})
        return "OK"

    def getClientList(self):
        return self.clientList
         
    def run(self):
        self.server.serve_forever()

if __name__ == "__main__":
    server = ServerWatcher(8888)
    server.run()
