import sys
import os
sys.stderr = sys.stdout
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import httplib, json
import urllib2
from base64 import b64encode
import urlparse
import urllib

class Couch:
    """Basic wrapper class for operations on a couchDB"""

    def __init__(self, host, port=5984, options=None):
        self.host = host
        self.port = port

    def connect(self):
        return httplib.HTTPConnection(self.host) # No close()

    # Basic http methods

    def send(self,act,uri,body=None):
        c = self.connect()
        headers = {"Accept": "application/json"}
        authorization = basic_auth(('sre','67869268'))
        if authorization:
            headers['Authorization'] = authorization   
        if body:
            #headers['Content-type'] = 'application/json'
            headers['Content-type'] = 'application/x-www-form-urlencoded'
            c.request(act,uri,body,headers)
        else:
            c.request(act,uri,None,headers)

        return c.getresponse()

    def get(self, uri):
        c = self.connect()
        headers = {"Accept": "application/json"}
        authorization = basic_auth(('sre','67869268'))
        if authorization:
            headers['Authorization'] = authorization            
        c.request("GET", uri, None, headers)
        return c.getresponse()

    def post(self, uri, body):
        c = self.connect()
        #headers = {"Content-type": "application/json"}
        #c.request('POST', uri, body, headers)
        return c.getresponse()

    def put(self, uri, body):
        c = self.connect()
        if len(body) > 0:
            headers = {"Content-type": "application/json"}
            c.request("PUT", uri, body, headers)
        else:
            c.request("PUT", uri, body)
        return c.getresponse()

    def delete(self, uri):
        c = self.connect()
        c.request("DELETE", uri)
        return c.getresponse()

def basic_auth(credentials):
    if credentials:
        return 'Basic %s' % b64encode('%s:%s' % credentials)

def application(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/html'),
                        ('Cache-Control','no-cache, no-store, max-age=0, must-revalidate')
                        ]
    couch = Couch('sre.cloudant.com')
    method = environ.get('REQUEST_METHOD')
    path = environ.get('PATH_INFO')
    query = environ.get('QUERY_STRING')
    body= ''  # b'' for consistency on Python 3.0  

    try:
        length= int(environ.get('CONTENT_LENGTH', '0'))
    except ValueError:
        length = 0
    if length != 0:
        body = environ['wsgi.input'].read(length)
    r = couch.send(method,path + '?' + query,body)
    status = "%s %s" % (r.status,r.reason)
    start_response(status,response_headers) 
    return [r.read()]
    #res = http.Resource("http://sre.cloudant.com:5489", http.Session())
    #r = couch.send('POST',"/_session",{'name':'sre','password':'67869268'})
    #c = couch.get('')
    #html = urllib2.urlopen('http://sre.cloudant.com').read()
    #r = couch.get('/_all_dbs')
    #return [str(urlparse.parse_qs(query))]