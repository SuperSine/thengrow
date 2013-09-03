class SimpleModel:
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

	def select(self,options={},fields='*',orderby='',groupby='',table_name='',
				limit=''):
		logic = ''

		table_name = self._getTableName(table_name)
		where = self._where(options)
	    
		qry = "SELECT %s FROM %s WHERE %s" % (fields,table_name,where)

		if groupby:
			qry = qry + (" GROUP BY %s" % groupby)
		if orderby:
			qry = qry + (" ORDER BY %s" % orderby)
		if limit:
			qry = qry + (" limit %s" % limit)

		return qry


	def insert(self,dataArray,table_name=''):
		exp = lambda x : x if x.isdigit() else "'%s'" % x
		table_name = self._getTableName(table_name)
		fields = ' , '.join(dataArray.keys())
		values = ' , '.join([exp(value) for value in dataArray.values()])
		qry = "INSERT INTO %s (%s) VALUES (%s)" % (table_name,fields,values)

		return qry

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