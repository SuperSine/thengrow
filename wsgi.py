import sys
import os
sys.stderr = sys.stdout
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import cgi
import MySQLdb
import json
import cgitb
cgitb.enable()
from cgi import parse_qs,escape
import re
import hashlib
import string
import random

SECRET = 'bigbian'

def id_generator(size=6, chars=string.ascii_lowercase + string.digits):
	return ''.join(random.choice(chars) for x in range(size))

def make_token():
	org = id_generator(7)
	pos = random.randint(0,24)
	org += chr(pos+97)
	sha1 = hashlib.sha1(org + SECRET)
	return org + sha1.hexdigest()[pos:pos+8]

def validate_token(token):
	rs = token[0:8]
	sha1 = hashlib.sha1(rs + SECRET)
	pos = ord(token[7])-97
	return token == rs + sha1.hexdigest()[pos:pos+8]

def short_text(text):
	_base = string.ascii_lowercase + "012345"
	m = hashlib.md5(text)
	url_hex = m.hexdigest()
	output = []

	for i in range(len(url_hex) / 8):
		sub_hex = url_hex[i*8:i*8+8]
		_int = 0x3FFFFFFF & int(('0x' + sub_hex),16)
		out = ''

		for j in range(3):
			out += _base[0x0000001F & _int]
			_int = _int >> 5

		output.append(out)
	return output

class Model:
	def __init__(self,db,table_name = ''):
		self._db = db
		self._table_name = table_name

	def __del__(self):
		self._db.close()

	def _getTableName(self,table_name=''):
		return table_name if table_name != '' else self._table_name

	def _chain(self,options,logic):
		exp       = lambda x : x if x.isdigit() else "'%s'" % x
		get_value = lambda x : exp(x[1]) if type(x) == list else exp(x)
		get_op    = lambda x : x[0] if type(x) == list else '='

		chain = (" %s " % logic).join(["%s %s %s"%(
													k, 
													get_op(options[k]),
													get_value(options[k])
												  ) 
													for k in options.keys()])
		return chain	

	def _another_chain(self,k,v):
		exp       = lambda x : x if x.isdigit() else "'%s'" % x
		get_value = lambda x : exp(x[1]) if type(x) == list else exp(x)
		get_op    = lambda x : x[0] if type(x) == list else '='
		logic = ''

		if type(v) == list:
			for value in v:
				logic = {'AND':value,'OR':value}.get(str(value))
				if logic == '':
					v.remove(logic)		
		if logic == '':
			logic = 'AND'

		chain = (" %s " % logic).join(["%s %s %s" % (
														k,
														get_op(val),
														get_value(val)
													) for val in v])
		return chain

	def _where(self,options):
		if options == {}:
			where = 1
		else:
			if '_LOGIC' in options:
				logic = options['_LOGIC'] 
				del options['_LOGIC']
			else:
				logic = 'AND'
			where_list = ["(%s)" % self._another_chain(k,options[k]) for k in options.keys()]
			where = (' %s ' % logic).join(where_list)
			#where = self._chain(options,logic)

		return where	

	def select(self,options={},fields='*',table_name=''):
		logic = ''

		table_name = self._getTableName(table_name)
		where = self._where(options)
	    
		qry = "SELECT %s FROM %s WHERE %s" % (fields,table_name,where)
		cur = self._db.cursor()
		cur.execute(qry)
		result = cur.fetchall()
		cur.close()
		return result


	def insert(self,dataArray,table_name=''):
		exp = lambda x : x if x.isdigit() else "'%s'" % x
		table_name = self._getTableName(table_name)
		fields = ' , '.join(dataArray.keys())
		values = ' , '.join([exp(value) for value in dataArray.values()])
		qry = "INSERT INTO %s (%s) VALUES (%s)" % (table_name,fields,values)
		cur = self._db.cursor()
		result = cur.execute(qry)
		self._db.commit()
		cur.close()
		return result

	def update(self,dataArray,options,table_name=''):
		qry = "UPDATE %s SET %s WHERE %s"
		table_name = self._getTableName(table_name)
		data_list = self._chain(dataArray,',')
		where = self._where(options)
		qry = qry % (table_name,data_list,where)
		cur = self._db.cursor()
		result = cur.execute(qry)
		cur.close()
		return result

	def query(self,qry):
		cur = self._db.cursor()
		result = cur.execute(qry)
		cur.close()
		return result

def registration(user_name,pwd,e_mail,model):
	sha = hashlib.sha1()
	#email regexp
	pattern = re.compile("^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$")
	if pattern.match(e_mail) == None:
		return -1
	options = {}
	options['username'] = user_name
	options['email']   = e_mail
	options['_LOGIC']  = 'OR'

	rows = model.select(options=options)
	if rows :
		return -2

	dataArray = {}
	sha.update(pwd)
	dataArray['username'] = user_name
	dataArray['password'] = sha.hexdigest()
	dataArray['email']    = e_mail
	result = model.insert(dataArray)

	return result

def login(usr,pwd,model):
	sha = hashlib.sha1()
	sha.update(pwd)

	options = {}
	options['username'] = usr
	options['password'] = sha.hexdigest()
	options['_LOGIC']  = 'AND'

	rows = model.select(options=options)

	if rows :
		return true
	return false


def create_tag(tag_name,tag_color,uid,model):
	tagids = short_text(tag_name+uid)
	options = {
				'tagid':[['=',val] for val in tagids]+['OR'],
				'entitystatus':'1'
			  }
	rows = model.select(fields='tagid,tagname',options=options)

	for row in rows:
		if tag_name == row[1]:
			return 'exist'
		for tagid in tagids:
			if tagid == row[0]:
				tagids.remove(tagid)
	tagid = tagids.pop()
	result = model.insert(dataArray={'tagid':tagid,'tagname':tag_name,'tagcolor':tag_color,'uid':uid})
	return result

def _GET(name,qs):
	d = parse_qs(qs)
	results = [escape(value) for value in d.get(name)]
	return results if results[0] != None else None

def _testReg(model):
	return registration('sresoft','123','sresoft@live.cn',model)

def application(environ, start_response):
	status = '200 OK'
	db = MySQLdb.connect(host="localhost", user="root", passwd="123", db="srebox_engrow")
	#create a cursor for the select

	model = Model(db,'srebox_engrow.tags')

	#execute an sql query
	#cur.execute("SELECT %s FROM test.name",'firstname')
	#rows = model.select(fields="username,email,DATE_FORMAT(created,'%e %M, %Y')")
	#output = _testReg(model)
	#rows=create_tag('fuzzy','99,88,22,22','1',model)
	#output = json.dumps(rows)
	#output = _testUpdate(db)
	
	#response_headers = [('Content-type', 'text/json')]
	response_headers = [('Content-type', 'text/html')]
	start_response(status, response_headers)

	return [str(environ.get('QUERY_STRING'))]