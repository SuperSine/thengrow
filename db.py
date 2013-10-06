import sys
import os
sys.stderr = sys.stdout
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import httplib, json
import urllib2
from base64 import b64encode
import urlparse
import urllib
import re
import json
from cgi import parse_qs,escape


def setUid2Key(obj,uid):
    uid = str(uid)
    
    if type(obj) == str: obj = parse_qs(obj)
    obj = parseFor(obj)

    startkey = 'startkey'
    endkey   = 'endkey'

    if obj.has_key(startkey) and type(obj[startkey]) is list:
        obj[startkey].insert(0,uid)
    if obj.has_key(endkey) and type(obj[endkey]) is list:
        obj[endkey].insert(0,uid)
    
    obj = urllib.urlencode(obj)
    return obj

def setUid2Body(body,uid):
    uid = str(uid)
    
    body = parseFor(body)
    
    if body.has_key('_user_id') == False:
        body['_user_id'] = uid

    body = parseBack(body)
    return body

class DataReviser:
    def __init__(self):
        self.dict = {}

    def setPair(self,key,func):
        if self.dict.has_key(key):return
        self.dict[key] = func

    def revise(self,key,data,uid):
        for dKey,dValue in self.dict:
            match = re.search(dKey,key)
            if match is None:continue
            data = self.dict[dKey](data,uid)
        return data

def parseFor(obj):
    if type(obj) is str:
        obj = json.loads(obj)
    for key in obj:
        if type(obj[key]) == str or type(obj[key]) == unicode:
            try:
                obj[key] = json.loads(obj[key])
            except ValueError:
                obj[key] = obj[key]
    return obj

def parseBack(obj):
    for key in obj:
        if type(obj[key]) == dict or type(obj[key]) == list:
            obj[key] = json.dumps(obj[key])
    obj = json.dumps(obj)

    return obj

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