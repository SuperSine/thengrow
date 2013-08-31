#!F:\Python27\python.exe
print "Content-type: text/json" + "\n"

import sys
#sys.stderr = sys.stdout

import cgi
import MySQLdb
import json
import cgitb
cgitb.enable()

db = MySQLdb.connect(host="localhost", user="root", passwd="123", db="test")

def dbSelect(table_name,fields,options,db):
	logic = ''
	if options == {}:
		where = 1
	else:
		if '_LOGIC' in options:
			logic = options['_LOGIC'] 
			del options['_LOGIC']
		else:
			logic = 'AND'

		where = (" %s " % logic).join(["%s = %s"%(k,options[k] 
													if options[k].isdigit() 
													else "'%s'" % options[k]) 
													for k in options.keys()])
	qry = "SELECT %s FROM %s WHERE %s" % (fields,table_name,where)
	cur = db.cursor()
	cur.execute(qry)

	return cur.fetchall()


def dbInsert(table_name,dataArray,db):
	return

def dbUpdate(table_name,dataArray,options,db):
	return

#create a cursor for the select
cur = db.cursor()

#execute an sql query
#cur.execute("SELECT %s FROM test.name",'firstname')
rows = dbSelect('test.name','firstname,lastname',{'firstname':'Cookie','lastname':'Monster','_LOGIC':'OR'},db)

data = [[row[0],row[1]] for row in rows]
print json.dumps(data)

# close the cursor
cur.close()

# close the connection
db.close ()

def _GET(name):
	form = cgi.FieldStorage()
	value = form.getvalue(name)

	return value



