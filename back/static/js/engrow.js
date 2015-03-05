var USER_ID = '1';
var NO_WTI = false;
var WTI_KEY = null;

var M_WTI_MERGE_SUCCESS = 'wti/merge_success';
var M_CRUMBS_DLOAD = 'crumbs/d_load';
var M_CRUMBS_RDOCS = 'crumbs/rdocs';
var M_ID_COLORS    = 'key/color';
var M_SHRT_ID      = 'shrt/id';
var wi     = null;
var tagger = null;
var highlighter = null;
var doctor = null;
var twi    = null;
var wi_del = null;

var docCookies = {
  getItem: function (sKey) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  
  
  removeItem: function (sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }
};


Utils.get_array = function(value){
  if(typeof(value) == 'string')value = value.split(',');
  return value instanceof Array ? value : null;  
}

Utils.unique = function(l){
	if(l.length == 0)return null;
	else if(l.length == 1)return l;

	return l.reduce(
			function(p,c,i,a){
				if(i == 1)p = [p];
				if(p.indexOf(c) == -1)p.push(c);
				return p;
			}
	);
}



function Methoder(){
	this.csrt = function(dict,i,list,fct){
		if(list.length == i)
			return fct;
		
		if(typeof(dict[list[i]]) == 'undefined')
			dict[list[i]] = {};
		dict[list[i]] = this.csrt(dict[list[i]],i+1,list,fct);

		return dict;
    }
    this.getFct = function(dict,i,list){
    	if(list.length == i)
    		return dict;
    	return this.getFct(dict[list[i]],i+1,list);
    }
	this.namespace = function(ns,fct){
		if(typeof(this.nsDict) == 'undefined')
			this.nsDict = {};
		ns = ns.split('/');
		if(typeof(fct) == 'undefined')
			fct = this.getFct(this.nsDict,0,ns);
		else
			this.csrt(this.nsDict,0,ns,fct);
		this.Runner = function(){
			this.run = fct;
		}
		return new this.Runner();
	}

}

Methoder.defineMethod = function(defineClass,funct){
	if(!defineClass.prototype[funct.name])
		defineClass.prototype[funct.name] = funct;
}

function CouchDb(url){
	$.couch.urlPrefix = (url ? url:"http://127.0.0.1:5000/db");
	//$.couch.urlPrefix = (url ? url:"http://sre.cloudant.com");

	this._wti_db_name = "engrow";
	this._crumbs_db_name = "engrow";
	this._doc_db_name = 'engrow';

	this._page_options = {};

	this.tags;

    this.docExists = false;//whether doc exists
/*	$.couch.login({
	    name: "sre",
	    password: "67869268",
	    success: function(data) {
	        console.log(data);
	    },
	    error: function(status) {
	        console.log(status);
	    }
	});*/

	this.getInstance = function(){
		return $.couch;
	}

	this.info = function(){
		$.couch.info({
		    success: function(data) {
		        console.log(data);
		    }
		});
	}

	this.db = function(){
		return this.getInstance().db(this._wti_db_name);
	}

	this.uploadWti = function(word_tag_info){
		var rData;
		this.getInstance().db(this._wti_db_name).saveDoc(
			{'word_tag_info':word_tag_info},
			{
				success:function(data){return data;},
				error:  function(data){return data;}
			}
		);
	}

	this.mergeWti = function(word_tag_info_1,word_tag_info_2,doc){
		this.getInstance().db(this._wti_db_name).updateDoc(
			"trigger/mergeEx",
			WTI_KEY ? WTI_KEY : "",
			{
				'word_tag_info_1':word_tag_info_1 ? JSON.stringify(word_tag_info_1) : '',
				'word_tag_info_2':word_tag_info_2 ? JSON.stringify(word_tag_info_2) : '',
				'doc' : doc ? JSON.stringify(doc) : '',
				'id' : uniqid(),
				'timestamp':new Date().getTime() / 1000,
				'type':'words',
				success:function(data){
				},
				error:  function(data){console.error(data);}
			}
		);		
	}

	this.mergeTags = function(tags){
		/*var id = md5(USER_ID.toString() + '_' + 'tags');*/
		var id = WTI_KEY ? WTI_KEY : "";
		this.getInstance().db(this._wti_db_name).updateDoc("trigger/mergeTags",
			id,
			{
				'tags':tags,
				'id':id,
				'type':'words',
				success:function(data){console.log(data);}
			}
		);
	}

	this.getTags = function(){
		var id = md5(USER_ID.toString() + '_' + 'tags');
		this.getInstance().db(this._wti_db_name).openDoc(id,
		{
			success:function(data){
				if(data.tags){
					tagger.tags = data.tags;
					highlighter = new Highlighter(tagger.tags);
					console.log('tags loaded!');
				}else
					console.log('no tags loaded!');
			}
		}
		);
	}

	this.getWti = function(){
		this.getInstance().db(this._wti_db_name).openDoc(USER_ID,
			{
				success:function(data){
					if(data.word_tag_info){
						tagsInfo = data.word_tag_info;
						twi = new WordInfo(tagsInfo);
						twi.restore(1);
						console.log('wti loaded!');
					}else
						console.log('no data loaded!');
				},
				error:  function(data){console.log(data);}
			}
		);
	}

	this.getLastWti = function(func){
		this.getInstance().db(this._wti_db_name).view(
			'words/wti',
			{
				limit:1,
				descending:true,
				include_docs:true,
				reduce:false,
				startkey:[],
				endkey:[{}],
				success:function(data){
					if(data.rows[0]){
						tagsInfo = data.rows[0].doc.word_tag_info;
						WTI_KEY = data.rows[0].id;
						twi = new WordInfo(tagsInfo);
						twi.restore(1);			
						func(data.rows[0].doc.tags,new Highlighter(data.rows[0].doc.tags));

						console.log('wti loaded!');
					}else
						console.log('no data loaded!');
				},
				error:function(data){
					console.log('no data loaded!');
				}
			}
		);
	}

	this.postCrumbs = function(crumbs){
		this.getInstance().db(this._crumbs_db_name).bulkSave({'docs':crumbs},
			{
				success:function(data){					
				}
			}
		);
	}

	this.updateCrumbs = function(crumbs){
		this.getInstance().db(this._crumbs_db_name).saveDoc({'docs':crumbs,'type':'crumbs'});
	}

	this.postDoc = function(doc){
		if(!doc)return;
		doc['type'] = 'doc';
		this.getInstance().db(this._doc_db_name).saveDoc(doc);
	}

	this.trySth = function(){
		this.getInstance().db('animaldb').bulkSave({'docs':
			[

				{
					'_id':'_design/trigger',
					'updates':{
						'hello':bigbian.toString()
					}
				}

			]
		},			{
				success:function(data){console.log(data);},
				error:  function(data){console.error(data);}
			});
	}

	this.trySth2 = function(){
		this.getInstance().db('engrow_words').updateDoc("trigger/merge",'sre',
			{
				'word_tag_info':JSON.stringify({'BIGBIAN':{'BIGBIAN':[1,"1"]}}),
				success:function(data){console.log(data);},
				error:  function(data){console.error(data);}
			}
		);
	}

	this.isDocExists = function(id){
		var parentThis = this;
		this.getInstance().db(this._doc_db_name).view(
			'docs/by_doc_ids',
			{
				'startkey':[id],
				'endkey':[id,{}],
				success:function(data){
					console.log(data);
					if(data.rows.length >= 1){
						parentThis.docExists = true;
						tagger._wi.clear();
					}else
						parentThis.docExists = false;					
				},
				error:  function(data){
					parentThis.docExists = false
				}
			}			
		);
	}

	this.fetchDocs = function(ids){
		this.getInstance().db(this._doc_db_name).view(
			'docs/by_doc_ids',
			{
				'include_docs':true,
				'keys':ids,
				success:function(data){
					if(!data.rows)return;
					_methoder.namespace(M_CRUMBS_RDOCS).run(data.rows);
				}
			}
		);
	}

	this.getWordInfo = function(word){
		var root = stemmer(word);
		/*
		parentThis = this;
		this.getInstance().db(this._crumbs_db_name).view(
			'crumbs/by_word',
			{
				'startkey':[root],
				'endkey':[root,{}],
				'reduce':false,
				success:function(data){
					console.log(data);
					var doc_list = [];
					for(var i in data.rows){
						var id = data.rows[i].value.doc_id;
						if(doc_list.indexOf(id) == -1)
							doc_list.push(id);
					}
					parentThis.fetchDocs(doc_list);
				}
			}
		);*/
		var options = 			{
				'reduce':false,
				success:function(data){
					console.log(data);
				}
			};
		if(root && root != ""){
			options['startkey'] = [root];
			options['endkey'] = [root,{}];
		}
		if(typeof(this.result) == 'undefined')
			this.result = new Result('crumbs/by_word',options);

		this.result.next();
	}

	this.getResult = function(url,options,focus){
		if(!options){
			options = {};
		}
		if(!options['limit'])
			options['limit'] = 11;

		var that = this;
		var _success = null;
		if(!this._page_options[url] || focus)this._page_options[url] = options;
		else options = this._page_options[url];

		if(!options['startkey'])
			options['startkey'] = -1;

		if(this.last_key)
			options['startkey'] = this.last_key;

		if(!options['success'])
			_success = function(data){};
		else
			_success = options['success'];

		options['success'] = function(data){
			if(data.rows.length != 0)
				that.last_key = data.rows[data.rows.length - 1].key;
			_success(data);
		};

		this.getInstance().db(this._crumbs_db_name).view(
			url,
			options
		);
	}

	this.getCrumbs = function(){
		if(typeof(this.last_key) == 'undefined')
			this.last_key = -1;
		if(typeof(this.wordsList) == 'undefined'){
			this.wordsList = [];
			this.wordsDict = {};//for check only
		}
		var parentThis = this;
		var options = {
			'descending':true,
			'group':     true,
			'group_level':2,
			'limit':50,
			success:function(data){
				if(data.rows.length == 0)return;
				console.log(data);
				parentThis.last_key = data.rows[data.rows.length - 1].key;
				for(var i in data.rows){
					var word = data.rows[i].value;
					if(parentThis.wordsDict[word])continue;
					parentThis.wordsDict[word] = true;
					_methoder.namespace(M_CRUMBS_DLOAD).run([word]);
				}

			}
		};

		if(this.last_key != -1){
			options['startkey'] = this.last_key;
			options['skip'] = 1;
		}

		this.getInstance().db(this._crumbs_db_name).view(
			'crumbs/by_time',
			options
		);
	}

}

function Result(url,queryOptions){
	$.couch.urlPrefix = "http://127.0.0.1:5000/db";
	this.dbName = "engrow";

	if(queryOptions['limit'])queryOptions['limit'] += 1;
	else queryOptions['limit'] = 10 + 1;

	this.queryOptions = queryOptions;
	var that = this;
	this.url = url;

	this.preStack = [];
	this.pre_startKey;
	this.next_startKey;
	this._hasPre = true;
	this._hasNext = true;

	this.couch = function(){
		return $.couch;
	}

	this.dealSuccess = function(){
		var _success;
		if(!this.queryOptions['success'])
			_success = function(data){};
		else
			_success = this.queryOptions['success'];
	
		this.queryOptions['success'] = function(data){
			if(data.rows.length != 0){
				that.next_startKey = data.rows[data.rows.length - 1].key;
				that.pre_startKey = data.rows[0].key;
			}

			if(data.rows.length < that.queryOptions['limit'])
				that._hasNext = false;
			else
				that._hasNext = true;

			if(that.preStack.length == 0)
				that._hasPre = false;
			else
				that._hasPre = true;

			_success(data);
		};		
	}
	this.getResult = function(){
		this.dealSuccess();
		this.couch().db(this.dbName).view(this.url,this.queryOptions);
	}
	this.hasPre = function(){return this._hasPre;};
	this.hasNext= function(){return this._hasNext;};
	this.pre    = function(){
		if(this.preStack.length >= 1){
			this.queryOptions['startkey'] = this.preStack.pop();
			this.getResult();
		}
	};
	this.next   = function(){
		if(that.pre_startKey){
			that.preStack.push(that.pre_startKey);
		}
		if(this.next_startKey)
			this.queryOptions['startkey'] = this.next_startKey;
		this.getResult();
	};
}

function Doctor(){
	this.doc = null;
	this.content = null;
	this.wordArray = null;

	this.getDoc = function(keys){
		var title = this.getContentTitle();
		var html  = this.getContentView();
		var cate  = this.getContentCate();
		var fingerprint = this.getContentFingerPrint();	
		var content = this.getContent();	

		if(!content)return undefined;
		
		this.doc = {			
			'doc_title':(!title || title == '') ? 'Untitled' : title,
			'doc_cate':(!cate || cate == '' ) ? 'None' : cate,
			/*'doc_content':content,*/
			'doc_html':html,
			'doc_date':new Date().getTime() / 1000,
			'doc_id':fingerprint,
			'doc_words':Utils.unique(this.wordArray)
		};		
		
		if(keys){
			var doc = {};
			for(var i in keys){
				doc[keys[i]] = this.doc[keys[i]];
			}

			this.doc = doc;
		}

		return this.doc;
	}

}
Doctor.prototype.getContent = function(){};
Doctor.prototype.getContentTitle = function(){};;
Doctor.prototype.getContentView = function(){};
Doctor.prototype.getContentCate = function(){};
Doctor.prototype.getContentFingerPrint= function(){};
Doctor.prototype.getWords = function(content){
	var regEx = /--{1,}|[^a-zA-Z]/ig;
	var wordsArray = content.replace(regEx," ").split(" ");
	this.wordArray = [];

	for(var i in wordsArray){
		var word = wordsArray[i];
		if(word.length <=1 || word.length>=50)continue;
		if(!Doctor.isUpperWord(word))word = word.toLowerCase();
		this.wordArray.push(word);
	}
	return this.wordArray;	
};
Doctor.isUpperWord = function(word){
	return word.match(/\b([A-Z]+)\b/g) == undefined ? false : true; 
}

Tagger.initTags = function(tags,methoder){
	this.switcher = function(tags,key){
		var dict = {};
		for(var i in tags){
			if(!tags.hasOwnProperty(i))continue;
			dict[tags[i][key]] = tags[i];
			dict[tags[i][key]]['id'] = i;
		}

		return dict;
	}
}

function Tagger(wt,getfeature,gc){
	this.gc = gc;
	this.tags = {};
	this.getfeature = getfeature;

	this.addFeature = function(value){
		var feat = getfeature(value);

		if(this._features[feat]){
			if(this._features[feat].indexOf(value) == -1)
				this._features[feat].push(value);
		}else{
            this._features[feat] = [];
            this._features[feat].push(value);			
		}

		return this._features[feat];

	}

	this._isUpperWord = function(word){
		return word.match(/\b([A-Z]+)\b/g) == undefined ? false : true; 
	}
	this.getTagName = function(id){
		return this.tags[id] ? this.tags[id]['name'] : '';
	}

	this.getTagsArray = function(){
		var l = [];
		var that = this;
		Object.keys(that.tags).forEach(
						function(key){
							that.tags[key]['key'] = key;
							l.push(that.tags[key]);
						}
				  );
		return l;
	}

	this.getTagId = function(key,value){
		if(!this.tags)return null;
		for(var id in this.tags){
			if(this.tags[id][key] == value)
				return id;
		}
		return null;
	}

	this.createTag = function(name,color,shrt){
		if(!this.gc || !name)return null;
		var gcValue = gc(5);
		var newTag = {
			'name':name,
			'color':color ? color : '',
			'shrt':shrt ? shrt : ''
		};
		/*this.newTags[gc(5)] = newTag;*/
		this.tags[gcValue] = newTag;

		return gcValue;
	}

	this.addTagByName = function(word,tnames){
		if(typeof(tnames) == 'string' && tnames)
			tnames = tnames.split(',');
		if(!word || !tnames || tnames.length == 0)return;	
		
		var tids = [];
		var that = this;
		tnames.forEach(function(name){
			var id = that.getTagId('name',name);
			id = id ? id : that.createTag(name);

			tids.push(id);
		});

		var words = this.addTag(word,tids);

		return words;
	}

	this.addTag = function(word,tids){
		if(typeof(tids) == 'string' && tids)
			tids = tids.split(',');
		if(!word || !tids || tids.length == 0)return;

		word = word.trim();
		if(!this._isUpperWord(word))word = word.toLowerCase();

		var wordsTable = new WordsTable();
		var wrapper = {};
		var feature = this.getfeature(word);
		var words = this._features[feature];
		var that = this;

		if(!words){
			words = this.addFeature(word);
			this._wordsTable.load([ word ]);
		}

		words.forEach(function(word){
			/*set 1 to the count if the word does not exist*/
			var count = that._wordsTable.getInfo(word) ? 0 : 1;
			wordsTable.body.table[word] = {'_count':count,'_tags':tids};
		});

		this._wordsTable.merge(wordsTable);

		return words;
	}

	this.setTag = function(word,tids){
		var _mergeTagHandler = this._wordsTable._mergeTagHandler;
		this._wordsTable._mergeTagHandler = function(old,last){ return last; };

		this.addTag(word,tids);

		this._wordsTable._mergeTagHandler = _mergeTagHandler;
	}

	this.getTags = function(word){
		word = word.trim();
		if(!this._isUpperWord(word))word = word.toLowerCase();	

		var info = this._wordsTable.getInfo(word);	

		return info && info['_tags'] ? info['_tags'] : [];
	}
	this.hasTag = function(word,tids){
		return false;
	}

	this.loadTags = function(tags){
		this.tags = JSON.parse( JSON.stringify(tags) );
	}

	this.mergeCommonTag = function(fWi,tags,defaultTags){
		/*tags = Utils.get_array(tags);*/
		for(var key in this._wordsTable.body.table){
			var info = fWi.getInfo(key) ? fWi.getInfo(key)['_tags'] : null;
			if(defaultTags && !info){
				info = typeof(defaultTags) == "string" ? defaultTags.split(',') : defaultTags;
			}else if(!info)
				continue;

			this.addTag(key,info);
		}
	}

	if(wt.constructor && wt.constructor.name == WordsTable.name){
		this._wordsTable = wt;
		this._features = {};
		for(var key in this._wordsTable.body.table){
			this.addFeature(key);		
		}
	}

}

function Highlighter(tags,contentarea){
	this.tags = tags;
	Highlighter.prototype.ContentArea = contentarea;

	this.getColor = function(tag){
		return this.tags[tag] ? this.tags[tag]['color'] : null;
	}

	this.highlightTag = function(wordInfo,tags){
		tags = Utils.get_array(tags);
		this.removeHighlight();

		for(var i in tags){
			var tag = tags[i];
			var color = this.getColor(tag);
			var words = Object.keys(wordInfo._wti[tag]);
			if(words == null)continue;
			this.highlight(words,color);
		}
	}
/*
	this.setColor = function(tag,color){
		this._tags_color[tag] = color;
	}*/
}

Highlighter.prototype.removeHighlight = null;
Highlighter.prototype.highlight       = null;
/*
function GeniusObject(obj){
	this._object = obj;

	this.getObj = function(){
		return this._object;
	}

}
function TO(obj){
	GeniusObject.call(this,obj);
}

function RO(obj){
	GeniusObject.call(this,obj);
}
*/

function toSimple(struct){
	var newWi = new WordInfo();
	for(var parent in struct){
		for(var child in struct[parent]){
			newWi._wti[child] = 1;
			newWi.defaultRef[child] = [];
			newWi.defaultRef[child][0] = struct[parent][child][0];
			if(struct[parent][child][1].length > 0)
				newWi.defaultRef[child][1] = struct[parent][child][1];

		}
	}
	return newWi;
}

var table = {
	'be':  {_count:43,_tags:['fsdf','fasd']},
	'good':{_count:43,_tags:['vcxf','fewd']},
};

function ObjectTable(construct){

}

ObjectTable.prototype._reduce = function(target,source){
	for (var prop in source) {
		if (typeof source[prop] === 'object') {
		  target[prop] = this._reduce.call(this,target[prop], source[prop]);
		}else {
		  if(target[prop] && source[prop])delete target[prop];
		}
	}
	return target;
};
ObjectTable.prototype._extend = function(target,source,func) {
	target = target || {};
	for (var prop in source) {
		if (typeof source[prop] === 'object') {
			if(source[prop].constructor.name === 'Array')
				target[prop] = target[prop] || [];
			target[prop] = this._extend.call(this,target[prop], source[prop],func);
		}else {
			if(typeof func === 'function')
				target[prop] = func(target[prop],source[prop],prop);
			else
				target[prop] = source[prop];
		}
	}
	return target;
};
ObjectTable.prototype._unique = function(arr) {
	var result = [];
	arr.forEach(function(item) {
	     if(result.indexOf(item) < 0) {
	         result.push(item);
	     }
	});
    return result;
}

ObjectTable.prototype.clone = function(obj){
	var source = JSON.stringify(obj);
	return JSON.parse(source);	
};

function WordsTable(construct){
	this.body = {table:{}};
	this.NONE_TAG = '0';

	if(construct && construct.constructor && construct.constructor.name == TagsTable.name){
		var tagsTable = construct;
		var table = this._fromTagsTable(tagsTable);
		this.body.table = table;
	}
}

function TagsTable(construct){
	this.body = {table:{}};
	this.NONE_TAG = '0';

	if(construct && construct.constructor && construct.constructor.name == WordsTable.name){
		var wordsTable = construct;
		var table = this._fromWordsTable(wordsTable);
		this.body.table = table;
	}
}

TagsTable.prototype._fromWordsTable = function(obj){
	if(!WordsTable.prototype._isWordsTable(obj))return;
	var table = obj.body.table;
	var result = {};
	Object.keys(table).forEach(function(word){
		if(!table[word]['_tags'])table[word]['_tags'] = [ NONE_TAG ];

		Object.keys(table[word]['_tags']).forEach(function(i){
			var tag = table[word]['_tags'][i];
			result[tag] = result[tag] || {};
			result[tag][word] = { '_count': table[word]['_count'] };
		});
	});

	return result;
}

TagsTable.prototype._isTagsTable = function(obj){
	return obj.constructor && obj.constructor.name == TagsTable.name;
}

TagsTable.prototype.merge = function(tagsTable){
	if(!this._isTagsTable(tagsTable))return;
	var that = this;
	var table;
	table = WordsTable.prototype._extend(this.body.table,tagsTable.body.table,function(target,source,prop){
		var result;
		var plusHandler = function(old,last){
			return (old = old ? old : 0) + last;
		};
	
		switch(prop){
			case '_count':
				result = plusHandler(target,source);
				break;
		};
		

		return result;
	});

	this.body['table'] = table;
}

TagsTable.prototype.toSimple = function(){
	var table = ObjectTable.prototype.clone(this.body.table);
	var result = {};

	Object.keys(table).forEach(function(tag){
		Object.keys(table[tag]).forEach(function(word){
			result[tag] = result[tag] || {};

			result[tag][word] = [table[tag][word]['_count']];
		});
	});

	return result;
}

TagsTable.prototype.fromSimple = function(obj){
	var tags = Object.keys(obj);
	var result = {};
	if(!tags)return;

	tags.forEach(function(tag){
		Object.keys(obj[tag]).forEach(function(word){
			result[tag] = result[tag] || {};

			result[tag][word] = { '_count':obj[tag][word][0] };
		});
	});

	this.body.table = result;
}

WordsTable.prototype._reduce = function(target,source,func){
	var exceptList = ['_tags'];
	for (var prop in source) {
		if(!target || !target[prop])continue;

		if (typeof source[prop] === 'object' && exceptList.indexOf(prop) == -1) {
		  target[prop] = this._reduce.call(this,target[prop], source[prop],func);
		}else {
			if(typeof func === 'function')
				func(target[prop],source[prop],prop);
			else
				delete target[prop];
		}
	}
	return target;
};	

WordsTable.prototype._extend = function(target,source,func) {
	target = target || {};
	var exceptList = ['_count','_tags'];
	for (var prop in source) {
		if (typeof source[prop] === 'object' && exceptList.indexOf(prop) == -1) {
			if(source[prop].constructor.name === 'Array')
				target[prop] = target[prop] || [];
			target[prop] = this._extend.call(this,target[prop], source[prop],func);
		}else {
			if(typeof func === 'function')
				target[prop] = func(target[prop],source[prop],prop);
			else
				target[prop] = source[prop];
		}
	}
	return target;
};

WordsTable.prototype._isWordsTable = function(obj){
	return obj.constructor && obj.constructor.name == WordsTable.name;
}
WordsTable.prototype._fromTagsTable = function(obj){
	if(!TagsTable.prototype._isTagsTable(obj))return;
	var table = obj.body.table;
	var result = {};
	Object.keys(table).forEach(function(tag){
		Object.keys(table[tag]).forEach(function(word){
			result[word] = result[word] || { _count : table[tag][word]['_count'], _tags:[] };
			result[word]['_tags'].push(tag);
			result[word]['_tags'] = ObjectTable.prototype._unique(result[word]['_tags']);
		});
	});

	return result;
}

WordsTable.prototype._reduceTagHandler = function(old,last){
	if(old instanceof Array && last instanceof Array){
		last.forEach(function(tag){
			old.splice(tag,1);
		});
	}

	if(!old.length)old.push( this.NONE_TAG );

	return old;
};		

WordsTable.prototype.deMerge = function(wordsTable){
	if(!this._isWordsTable(wordsTable))return;
	var table;
	var that = this;
	table = this._reduce(this.body.table,wordsTable.body.table,function(target,source,prop){

		switch(prop){
			case '_tags':
				that._reduceTagHandler(target,source);
				break;
		};
	});

	this.body['table'] = table;
}

WordsTable.prototype._plusCountHandler = function(old,last){
	return (old = old ? old : 0) + last;
}

WordsTable.prototype._mergeTagHandler = function(old,last){
	if(typeof(old) == 'undefined' || old == null)old = [];
	if(last instanceof Array){
		old =  old.concat( last );
	}else if(last != null && last != that.NONE_TAG)
		old.push( last );

	old = ObjectTable.prototype._unique(old);

	return old;
};


WordsTable.prototype.merge = function(wordsTable){
	if(!this._isWordsTable(wordsTable))return;
	var that = this;
	var table;
	table = this._extend(this.body.table,wordsTable.body.table,function(target,source,prop){
		var result;
		
		switch(prop){
			case '_count':
				result = that._plusCountHandler(target,source);
				break;
			case '_tags':
				result = that._mergeTagHandler(target,source);
				break;
		};
		

		return result;
	});

	this.body['table'] = table;
}

WordsTable.prototype.load = function(wordsArray){
	var that = this;
	wordsArray.forEach(function(word){
		var info = that.body.table[word];
		
		info = info || {'_tags' : [ that.NONE_TAG ]};

		info['_count'] = info['_count'] ? info['_count']+1 : 1;

		that.body.table[word] = info;
	});
}

WordsTable.prototype.toSimple = function(){
	var table = ObjectTable.prototype.clone(this.body.table);
	var result = {};

	Object.keys(table).forEach(function(word){
		result[word] = [ table[word]['_count'],table[word]['_tags'] ];
	});

	return result;
};

WordsTable.prototype.fromSimple = function(obj){
	var words = Object.keys(obj);
	var result = {};
	if(!words)return;

	words.forEach(function(word){
		result[word] = result[word] || {};

		result[word]['_count'] = obj[word][0];
		result[word]['_tags']  = obj[word][1];
	});

	this.body.table = result;
};

WordsTable.prototype.getInfo = function(word){
	return this.body.table[word];
}

function WordInfo(construct,selfDelete){
	var DEFAULT_TAG = '0';
	var DELETE_FLAG = '!';
	this._setDefaultRef = function(key){
		if(typeof(this.defaultRef) == 'undefined')
			this.defaultRef = {};
		if(this.defaultRef[key] == null)
			this.defaultRef[key] = [];
		return this.defaultRef[key];
	}

	this._getRm = function(c){
		if(c.indexOf('!') == 0)
			c = c.substring(1);
		else 
			c = null;
		return c;
	}

	this._unique = function(l){
		if(l.length == 0)return null;
		else if(l.length == 1)return l;
		var that = this;
		return l.reduce(
				function(p,c,i,a){
					if(i == 1){
						if(that.selfDelete)
							p = p.indexOf('!') == -1 ? [p] : [];
						else
							p = [p];
						this.d = {};
					}
					if(c.indexOf('!') == 0 && that.selfDelete){
						c=c.substring(1);
						var n = (pi = p.indexOf(c))>=0 ? 1 : 0;
						p.splice(pi,n);
					}
					else if(!this.d[c])p.push(c);
					this.d[c]=1;
					return p;
				});
	}

	this._clone = function(obj){
		var source = JSON.stringify(obj);
		return JSON.parse(source);
	}

	this._plus = function(old,last){
		return (old = old ? old : 0) + last;
	}

	this._getNewTag = function(old,last){
		if(typeof(old) == 'undefined' || old == null)old = [];
		if(last instanceof Array){
			var nIndex = last.indexOf('0');
			if(nIndex != -1)
				last.splice(nIndex,1);
			old =  old.concat( last );
		}else if(last != null && last != DEFAULT_TAG && old.indexOf(last) == -1)
			old.push( last );

		old = this._unique(old);

		return old;
	}

	this._setDefault = function(key){
		if(typeof(this._wti[key]) == 'undefined')
			this._wti[key] = 1;
		return this._wti[key];
	}

	this.getDeleteFlag = function(){
		return DELETE_FLAG;
	}

	this.setInfo = function(key,values,newValFunc){
		for(var i in values){
			var index = values[i]['index'];
			var value = values[i]['value'];

			if(!value)continue;/*no null value can be assigned*/

			ref = this._setDefaultRef(key);

			ref[index] = newValFunc.call(this,ref[index],value);
		}
	}

	this.getInfo = function(key){
		if(typeof(this.defaultRef) == 'undefined')return null;
		return this.defaultRef[key];
	}

	this.reverse = function(index){
		for(var key in this._wti){
			var info = this.getInfo(key)[index];
			if(info == null)info = [];
			
			switch(index){
				case 1:
					if(info.length == 0)info.push(DEFAULT_TAG);
					for(var i in info){
						var switched = this.switchFlag(info[i],key);
						this._setDefault( switched[0] );
						if(!(this._wti[ switched[0] ] instanceof Object))
							this._wti[ switched[0] ] = {};
						this._wti[ switched[0] ][ switched[1] ] = 1;
					}
					break;
				case 0:
					this._setDefault(info);
					if(!(this._wti[info] instanceof Object))
						this._wti[info] = {};
					this._wti[info][key] = 1;
					break;
			}

			delete this._wti[key];
			delete this.defaultRef[key][index];
		}
	}

	this.switchFlag = function(from,to){
		var fromValue = this._getRm(from);
		var fromFlag  = fromValue ? DELETE_FLAG : '';

		var toValue = this._getRm(to);
		var toFlag  = toValue ? DELETE_FLAG : '';

		from = toFlag + (fromValue ? fromValue : from);
		to   = fromFlag + (toValue ? toValue : to);

		return [from,to];
	}

	this.restore = function(index){
		for(var key in this._wti){
			for(var skey in this._wti[key]){
				this._setDefault(skey);
				var func = null;
				switch(index){
					case 0:
						func = this._plus;
						break;
					case 1:
						func = this._getNewTag;
						break;
				}
				this.setInfo(skey,[{'index':index,'value':key}],func);
			}
			delete this._wti[key];
		}
	}

	this.extend = function(target, source) {
		target = target || {};
		for (var prop in source) {
			var r = this._getRm(prop);
			if(r){this.remove(r);continue;}
			if (typeof source[prop] === 'object') {
			  target[prop] = this.extend.call(this,target[prop], source[prop]);
			}else {
			  target[prop] = source[prop];
			}
		}
		return target;
	}

	this.newMerge = function(obj){
		var counter = 0;
		var scounter = 0;
		var wti = null;
		var ref = {};

		/*is raw data object or WordInfo object*/
		if(obj.constructor && obj.constructor.name == this.constructor.name){
			wti = obj._wti;
			ref = obj.defaultRef;
		}else
			wti = obj;

		this.extend(this._wti,wti);
		
	}

	this.merge = function(obj){
		var counter = 0;
		var scounter = 0;
		var wti = null;
		var ref = {};

		/*is raw data object or WordInfo object*/
		if(obj.constructor && obj.constructor.name == this.constructor.name){
			wti = obj._wti;
			ref = obj.defaultRef;
		}else
			wti = obj;

		for(var key in wti){
			counter += 1;
			if(this.selfDelete){
				var r = this._getRm(key);/*delete cmd*/
				if(r != null){this.remove(r);continue;}
			}
			this._setDefault(key);
			/*assign the info directly*/
			if(wti[key] instanceof Array){ref[key] = wti[key];continue;}

			for(var skey in wti[key]){
				if(this.selfDelete){
					var r = this._getRm(skey);/*delete cmd*/
					if(r != null){this.remove(r,key);continue;}
				}				
				if(!(this._wti[key] instanceof Object))
					this._wti[key] = {};
				this._wti[key][skey] = 1;		

				if(wti[key][skey] instanceof Array)
					ref[skey] = wti[key][skey];		
				scounter += 1;
			}
		}

		for(var key in ref){
				this.setInfo(key,[{'index':0,'value':ref[key][0]}],this._plus);
				this.setInfo(key,[{'index':1,'value':ref[key][1]}],this._getNewTag);		
		}

		return scounter ? scounter : counter;
	}

	this.move = function(from,to){
		var obj = {};
		obj[to] = this._wti[from];

		this.merge(obj);
		delete this._wti[from];
	}

	this.remove = function(key,root){
		if(!key)return;
		delete this.defaultRef[key];
		if(root && this._wti[root])
			delete this._wti[root][key];
		else
			delete this._wti[key];
	}

	this.load = function(wordsArray){
	    for (var i = 0; i < wordsArray.length;++i){
	        var word = wordsArray[i];
	        var ref = this._setDefaultRef(word);
	        ref[0] = ref[0] ? ref[0] + 1 : 1;
	        this._setDefault(word);
	    }
	}

	this.toJson = function(){
		var wti = this._clone(this._wti);
		for(var key in wti){
			if(wti[key] instanceof Object){
				for(var skey in wti[key]){
					wti[key][skey] = this.defaultRef[skey];
				}
			}else
				wti[key] = this.defaultRef[key];
		}

		return wti;
	}

	this.clear = function(){
		delete this._wti;
		delete this.defaultRef;

		this._wti = {};
		this.defaultRef = {};
	}

	this._wti = {};
	this.selfDelete = selfDelete ? selfDelete : true;/*is self-deleted enabled*/
	if(construct && typeof(construct) == 'string' && construct != ''){
		construct = JSON.parse(construct);
		this.merge(construct);
	}else if(typeof(construct) == this.constructor.name){
		this._wti = this._clone(constructor._wti);
		this.defaultRef = this._clone(constructor.defaultRef);
	}else if(typeof(construct) == 'object' && construct)
		this.merge(this._clone(construct));

	if(this.defaultRef == null)this.defaultRef = {};	
}

function WordInfoDeprecated(construct){
	var COUNT_KEY = '__count__';
	if(typeof(construct) == 'string')
		this._wti = JSON.parse(construct);
	else if(typeof(construct) == this.name){
		var wti = JSON.stringify(construct._wti);
		wti = JSON.parse(wti);
		this._wti = wti;
	}else if(typeof(construct) == 'object')
		this._wti = construct;
	else
		this._wti = {};

	this._setDefaultRef = function(key){
		if(typeof(this.defaultRef) == 'undefined')
			this.defaultRef = {};
		if(this.defaultRef[key] == null)
			this.defaultRef[key] = [];
		return this.defaultRef[key];
	}
	this._getRm = function(c){
		if(c.indexOf('!') == 0)
			c = c.substring(1);
		else 
			c = null;
		return c;
	}
	this._unique = function(a) {
	    for(var i=0; i<a.length; ++i){
	        for(var j=i+1; j<a.length; ++j) {
	        	var r = this._getRm(a[j]);
	            if(a[i] === a[j])
	                a.splice(j--, 1);
	        }
	        var r = this._getRm(a[i]);
	    	if(r != null){a.splice(i--,1);a.splice(a.indexOf(r),1);i--;}
	    }
	    return a;
	};

	this._clone = function(obj){
		var source = JSON.stringify(obj);
		return JSON.parse(source);
	}

	this._isDigit = function(x) {
		var y=parseInt(x);
		if (isNaN(y)) return false;
		return x == y || x.toString() == y.toString();
	}

	this._getNewTag = function(body,tag){
		if(typeof(body) == 'undefined')body = [];
		if(tag instanceof Array){
			var nIndex = tag.indexOf('0');
			if(nIndex != -1)
				tag.splice(nIndex,1);
			body = this._unique( body.concat( tag ) );
		}else if(tag != null && body.indexOf(tag) == -1)
			body.push( tag );

		return body;
	}

	this._setDefault = function(root,word){
		if(typeof(this._wti[root]) == 'undefined'){
			this._wti[root] = {};
			this._wti[root][word] = [];
		}else if(typeof(this._wti[root][word]) == 'undefined')
			this._wti[root][word] = [];
		
		return this._wti[root][word];
	}

	this.setInfo = function(parent,child,values,newValFunc){
		var ref = this._setDefault(parent,child);

		for(var i in values){
			var index = values[i]['index'];
			var value = values[i]['value'];
			var global= values[i]['global'];

			if(global)
				ref = this._setDefaultRef(child);

			ref[index] = newValFunc(ref[index],value);
		}

	}

	this._mergeInfo = function(root,word,info){
		var old = this._setDefault(root,word);
		if(!info.hasOwnProperty('length'))return;
		for(var i in info){
			if(info[i] instanceof Array)
				old[i] = this._getNewTag(old[i],info[i]);
			else if(this._isDigit(info[i])){
				var count_dict = WordInfo.prototype[COUNT_KEY];
				if(count_dict && !count_dict[word]){
					count_dict[word] = (count_dict[word] == null ? 0 : count_dict[COUNT_KEY][word]) + info[i];
				}else
					old[i] = (old[i] == null ? 0 : old[i]) + info[i];
			}else
				old[i] = info[i];
			
		}
		this._wti[root][word] = old;
	}

	this.restore = function(keyIndex,keyType){
		if(keyIndex != 0 && keyIndex != 1)return;
		for(var key in this._wti){
			for(var word in this._wti[key]){
				var root = stemmer(word);
				/*simple copy*/ 
				var info = [this._wti[key][word][0],this._wti[key][word][1]];
				switch(keyType){
					case 'Array':info[keyIndex] = [key];break;
					default:info[keyIndex] = key;
				}
				this._setDefault(root,word);					
				this._mergeInfo(root,word,info);
			}
			/*no reference is required now, remove it*/
			this.remove(key);
		}

	}

	this.reverse = function(index){
		for(var p in this._wti){
			for(var c in this._wti[p]){
				var info = this._wti[p][c][index];
				
				if(info.length == 0)info.push(0);

				switch(index){
					case 1:
						for(var i in info){
							this.setInfo(info[i],
										c,
										[
											{
												'index':index,
												'value':this._wti[p][c][0],
												'global':true
											}
										],
										function(old,last){return last;});
						}
						break;
					case 0:
						this.setInfo(info,
									c,
									[
										{
											'index':index,
											'value':this._wti[p][c][1]
										}
									]);
						break;
				}


/*				
				var keys = [];

				if(typeof(info) == 'undefined' || info.length == 0)keys.push(0);
				else if( !(info instanceof Array) )keys.push(info);
				else keys = info;

				for(var i in keys){
					var key = keys[i];
					if(!keys.hasOwnProperty(i))continue;
					this._mergeInfo(key,c,this._wti[p][c]);
					
					this._wti[key][c].splice(index,1);
				}
*/
			}
			/*no reference is required now, remove it*/
			this.remove(p);
		}
	}

	this.merge = function(obj){
		var obj_wti;
			
		if(typeof(obj) == this.name)
			obj_wti = obj._wti;
		else
			obj_wti = obj;

		for(var p in obj_wti){
			var r = this._getRm(p);
			if(r != null){
				this.remove(r);
				continue;
			}
			for(var c in obj_wti[p]){
				var r = this._getRm(c);
				if(r != null){this.remove(p,this._getRm(c));continue;}
				this._setDefault(p,c);
				this._mergeInfo(p,c,obj_wti[p][c]);
			}
		}				
		

	}

	this.move = function(from,to){
		var obj = {};
		obj[to] = this._wti[from];

		this.merge(obj);

		this.remove(from);
	}

	this.remove = function(p,c){
		if(p != null && c != null)
			delete(this._wti[p][c]);
		else if(p != null)
			delete(this._wti[p]);
	}

/**********************/
	this.incrHit = function(root,word){
		this._setDefault(root,word);
		this._wti[root][word][0] += 1;

		return this._wti[root][word][0];
	}

	this.load = function(wordsArray){
	    for (var i = 0; i < wordsArray.length;++i) {
	        var word = wordsArray[i];
	        var root = stemmer(word);

	        this.incrHit(root,word);
	    }
	}

	this.addTag = function(word,tag){
		var p = stemmer(word);
	    
		for(var c in this._wti[p]){
			this._wti[p][c][1] = this._getNewTag(this._wti[p][c][1],tag);
		}
	}

	this.removeTag = function(tag,word){
		var p = stemmer(word);
		if(this._wti[p] == null || this._wti[p][word] == null)return;
		var cTags = this._wti[p][word][1];
		cTags.splice(cTags.indexOf(tag),1);
		this._wti[p][word][1] = cTags;

		return cTags;	
	}
/**********************/
}


var _methoder = new Methoder();
var _couchDb  = new CouchDb();
var wordInfoDict = {};//current tags and word count info
var wordTag = {};
var tagColor=[];

var docs = [];
var crumbs = [];
var tagsInfo = {};//all tags and word count info
var tags = [];

var deletedTags = [];//tags which user deleted saved in

var docId = uniqid();

var auto_highlights = [];
var auto_mark       = [];
var wordArray = null;

var content;//english content

var add_tag_shortcuts = {
	'Ctrl+J':'1',
	'Ctrl+K':'2',
	'Ctrl+L':'3'
};

var remove_tag_shortcuts = {
	'Alt+J':'1',
	'Alt+K':'2',
	'Alt+L':'3'
};

var tag_colors = {
	'1':'186,112,255,0.3',
	'2':'176,204,73,0.3',
	'3':'227,175,120,0.3'
};

var tag_names = {
	'1':'unknown',
	'2':'fuzzy',
	'3':'wired'
};

var tag_info_by_name = {
	'unknown':['186,112,255,0.3','1'],
	'fuzzy':['176,204,73,0.3','2'],
	'wired':['227,175,120,0.3','3']
};

var contentarea= 'contentarea';
/*function(doc){
	if(doc.word_tag_info){
		emit(doc._id,doc.word_tag_info);
	}
}
*/





function tweak_tagsInfo(){
	for(var root in tagsInfo){
		for(var word in tagsInfo[root]){
			var tags = tagsInfo[root][word][1];
			console.log(root,word,tags);
			if(typeof(tags[0]) == 'object'){
				//console.log(tags);
				var newTags = [];
				for(var i in tags){
					if(tags[i] != null && typeof(tags[i]) == 'object'){
						for(var j in tags[i]){
							newTags = getNewTag(newTags,tags[i][j]);
						}
					}else
						newTags = getNewTag(newTags,tags[i]);
				}
				tagsInfo[root][word][1] = newTags;
			}
		}

	}
}

function wordInfoStats(){
	var count = 0;

	for(var root in tagsInfo){
		for(var j in tagsInfo[root]){
			count += 1;
		}
	}

	console.log(count);
}

function knownInfoStats(){
	var invertTags = invertTagsInfo(tagsInfo,1);
	var count = 0;
	for(var i in invertTags){
		count += invertTags[i].length;
	}
	console.log(count);
}

function convert_keycode(isCtrl,isShift,isAlt,keyCode){
	var keys = '';
	if(isCtrl)keys += 'Ctrl+';
	if(isShift)keys += 'Shift+';
	if(isAlt)keys += 'Alt+';

	keys += String.fromCharCode(keyCode);

	return keys;
}

/*keyboard shortcut*/
function init_shortcuts(){
	for(var key in add_tag_shortcuts){
		$.Shortcuts.add({
			type:'down',
			mask:key,
			handler:function(event){
				var word = getSelectionText();
				if(word == '')return;
				word = word.trim();
				if(!Doctor.isUpperWord(word))word = word.toLowerCase();

				var keys = convert_keycode(event.ctrlKey,
										   event.shiftKey,
										   event.altKey,
										   event.keyCode);
				/*var tag = add_tag_shortcuts[keys];*/
				var tag = tagger.getTagId('shrt',keys);
				if(!tagger.hasTag(word,tag)){
					var words = tagger.addTag(word,tag);
					/*tagger.addCrumb(word,tag,doctor.getContentFingerPrint(),1);*/
					highlighter.highlight(words,tag,tag);
				}else{
					var words = tagger.addTag(word,'!' + tag);
					highlighter.highlight(words,null,tag);
				}
			}
		});
	}

	for(var key in remove_tag_shortcuts){
		$.Shortcuts.add({
			type:'down',
			mask:key,
			handler:function(event){
				var word = getSelectionText();
				if(word == '')return;

				var keys = convert_keycode(event.ctrlKey,
										   event.shiftKey,
										   event.altKey,
										   event.keyCode);
				var tag = remove_tag_shortcuts[keys];
				
				tagger.addTag(word,'!' + tag);
			}
		});
	}

	$.Shortcuts.start();
}


function addDoc(title,cate,content,html,fingerprint){
	docs.push({
			'doc_title':(title == null || title == '') ? 'Untitled' : title,
			'doc_cate':cate,
			'doc_content':content == null ? '' : content,
			'doc_html':html,
			'doc_date':new Date().getTime() / 1000,
			'doc_id':fingerprint
		});

	return true;
}

function addCrumb(root,word,hex,id,status){
	crumbs.push({
			'root':root,
			'word':word,
			'tag':hex,
			'doc_id':id,
			'time':new Date().getTime() / 1000,
			'status':status
		});

	return true;
}

function getSelectionText(){
	var selection = getSelection();
	return selection.toString();
}

function getWords(content){
	var regEx = /--{1,}|[^a-zA-Z]/ig;
	var wordsArray = content.replace(regEx," ").split(" ");
	var result = [];

	for(var i in wordsArray){
		var word = wordsArray[i];
		if(word.length <=1 || word.length>=50)continue;
		if(!isUpperWord(word))word = word.toLowerCase();
		result.push(word);
	}
	return result;
}

/**/
var getContent = function(){}
var getContentTitle = function(){}
var getContentView = function(){}
var getContentCate = function(){}
var getContentFingerPrint = function(){}

var capture = function (){}
/**/

function action() {
    wordInfoDict = {};
    wordTag = {};
    var info = {};
	
    content = getContent();
    wordArray = getWords(content);
	//document.getElementById(""+contentarea).innerHTML = content;
	_couchDb.isDocExists(getContentFingerPrint());

    for (var i = 0; i < wordArray.length;++i) {
        var word = wordArray[i];
        var root = stemmer(word);
        if (wordInfoDict[root] != undefined) {
            if (wordInfoDict[root][word] != undefined){ 
				wordInfoDict[root][word][0] += 1;
                //console.log(root+":"+word);
            }else {
				wordInfoDict[root][word] = [1];
			}
        } else {
            wordInfoDict[root]={};
            wordInfoDict[root][word]=[1,[]];
            wordTag[root] = [0];
        }
        wordTag[root][0]+=1;
    }
    //document.getElementById("resultarea").innerHTML = JSON.stringify(wordTag);
	//loadTagColor();
}

function actionEx(func){
	doctor = new Doctor();
	wi = new WordInfo();
	wi_del = new WordInfo(null,false);
	highlighter = null;
	gTagger = null;

    content = doctor.getContent()
    wi.load(doctor.getWords(doctor.getContent()));
	tagger = new Tagger(wi,stemmer,gc);

	tagger_del = new Tagger(wi_del,stemmer,gc);	

	
	_couchDb.isDocExists(doctor.getContentFingerPrint());
	_couchDb.getLastWti(function(tags,hl){
		if(func)func.call(this,tags,hl);
	});
	//_couchDb.getTags();
	/*highlighter = new Highlighter(tag_colors);*/
	
}

function invertTagsInfo(tagsInfo,index){
	/*create a copy*/
	tagsInfoClone = JSON.stringify(tagsInfo);
	tagsInfoClone = JSON.parse(tagsInfoClone);

	var invertedInfo = {};
	this.isDigit = function(x) {
		var y=parseInt(x);
		if (isNaN(y)) return false;
		return x == y || x.toString() == y.toString();
	}
	for(var root in tagsInfoClone){
		for(var word in tagsInfoClone[root]){
			var keys = tagsInfoClone[root][word][index];/*hit count or tags list*/
			if( !(keys instanceof Array) )keys = [keys]
			else if(typeof(keys) == 'undefined' || keys.length == 0)keys = [0];/*no tag*/
			
			for(var i in keys){
				var key = keys[i] ? keys[i] : 0;
				if(invertedInfo[key] == null)
					invertedInfo[key] = {};
				if(invertedInfo[key][word] == null)
					invertedInfo[key][word] = tagsInfoClone[root][word];
			}
			/*no reference is required now, remove it*/
			tagsInfoClone[root][word].splice(index,1);
		}
	}

	return invertedInfo;
}

function reverse(tagsInfo,index){
	/*create a copy*/
	tagsInfoClone = JSON.stringify(tagsInfo);
	tagsInfoClone = JSON.parse(tagsInfoClone);

	wti = new WordInfo();

	for(var p in tagsInfoClone){
		for(var c in tagsInfoClone[p]){
			var info = tagsInfoClone[p][c][index];
			var keys = [];

			if(typeof(info) == 'undefined' || info.length == 0)keys.push(0);
			else if( !(info instanceof Array) )keys.push(info);
			else keys = info;

			for(var i in keys){
				var key = keys[i];
				if(!keys.hasOwnProperty(i))continue;/*not data*/
				wti._setDefault(key,c);
				wti._mergeInfo(key,c,tagsInfoClone[p][c]);
			}
			/*no reference is required now, remove it*/
			tagsInfoClone[p][c].splice(index,1);
		}
	}

	return wti;
}

function restoreInvert(invertTagsInfo,keyIndex,keyType){
	/*create a copy*/
	invertTagsInfoClone = JSON.stringify(invertTagsInfo);
	invertTagsInfoClone = JSON.parse(invertTagsInfoClone);
	
	if(keyIndex != 0 && keyIndex != 1)return;
	wti = new WordInfo();

	for(var key in invertTagsInfoClone){
		for(var word in invertTagsInfoClone[key]){
			var root = stemmer(word);
			var info = invertTagsInfoClone[key][word];
			switch(keyType){
				case 'Array':info[keyIndex] = [key];break;
				default:info[keyIndex] = key;
			}
			wti._setDefault(root,word);
			wti._mergeInfo(root,word,info);
		}
	}

	return wti;

}

function toHex(n) {
 n = parseInt(n,10);
 if (isNaN(n)) return "00";
 n = Math.max(0,Math.min(n,255));
 return "0123456789ABCDEF".charAt((n-n%16)/16)
      + "0123456789ABCDEF".charAt(n%16);
}
function toHexs(nums){
	nums = nums.split(',');
	var t = '';
	for(var i in nums){
		var h = toHex(nums[i]);
		t = setTag(t,h);
	}
	return t;
}
function hexToC(hex,s){
	return parseInt((cutHex(hex)).substring(s,2),16).toString();
}
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
function highlightWord(root,tagColor){
	words=wordInfoDict[root];
	if(words==undefined)return;
	var highlights = [];
	for(var word in words){
		if(!words.hasOwnProperty(word))continue;
		highlights.push(word);		
	}


	var pattern = "\\b"+highlights.join('|')+"\\b";
	if(tagColor != null)
		$("#"+contentarea).highlight(pattern,tagColor);
	else
		$("#"+contentarea).removeHighlight(pattern);
	
	
}
function hightlightText(highlights,color){
	if(highlights.length == 0)return;
	if(typeof(highlights) == 'undefined'){
		$("#"+contentarea).removeAllHighlight();
		return;
	}

	var pattern = "\\b("+highlights.join('|')+")\\b";
	if(color != null)
		$("#"+contentarea).highlight(pattern,color);
	else
		$("#"+contentarea).removeHighlight(pattern);
}
function getTagColor(tag){
	for(var i=0;i<tagColor.length;++i){
		codes=tagColor[i].split(":");
		if(codes[0] == tag)return codes[1];
	}
}
function getTagColorEx(tag){
	return tag_colors[tag];
}
function loadTagColor(){
	colorArray = $("#tagColor").val().split(";");
	for(var i=0;i < colorArray.length;++i){
		tagColor[i]=colorArray[i];
		tags.push(colorArray[i].split(':')[0]);
	}
}

function getTagId(){
	return tagColor.length + 1;
}
function hasTag(body,tag){
	if(body == undefined || body == "")return false;
	main=body.substring(body.indexOf('#'),body.length);
	return main.indexOf(tag) % 2 == 0 ? true : false;
}
function containWord(body,word){
	var re = new RegExp("\\b(" + word +")\\b",'g');
	return re.test(body);
}

function setTag(body,tag){
	if(hasTag(body,tag))return body;
	return body+tag;
}
function getNewTag(body,tag){
	if(tag != null && body.indexOf(tag) == -1)body.push(tag);
	return body;
}

function combineNewTag(list1,list2){
	var combo = list1;
	for(var i in list2){
		combo = getNewTag(combo,list2[i]);
	}

	return combo;
}
function applyTag(){
	c=document.getElementById("wordTag").value;
	tag=c.split(':')[1];
    word=c.split(':')[0];

    addTag(word,tag);
}

function getTags(root,word,dict){
	if(dict[root] == null || dict[root][word] == null)return [];
	return dict[root][word][1];
}

function addTag(word,tag){
	word = word.trim();
    if(!isUpperWord(word))word = word.toLowerCase();
	root=stemmer(word);
	//tag=toHex(tag);
	if(wordTag[root] == undefined )wordTag[root]=[];
	old=wordTag[root][1];
	if(old==undefined)old=[];
	wordTag[root][1]=getNewTag(old,tag);
	if(wordInfoDict[root] == undefined && containWord(word,content)){
		wordInfoDict[root] = {};
		wordInfoDict[root][word] = [1,[]];
	}
    
	var words = wordInfoDict[root];
	var highlights = [];
	for(var word in words){
/*		var tags = getTags(root,word,tagsInfo);
		if(tags.length >= 1)continue;*/
		wordInfoDict[root][word][1] = getNewTag(old,tag);
		highlights.push(word);
	}
	//tag=hexToC(tag,0);
	color=getTagColorEx(tag);
	hightlightText(highlights,color);

	addCrumb(root,word,tag,fingerprint,1);
}

function removeTag(word,tag,dict){
	word = word.trim();
    if(!isUpperWord(word))word = word.toLowerCase();
	var root = stemmer(word);
	if(dict[root] == null || dict[root][word] == null)return;
	var cTags = dict[root][word][1];
	var index = cTags.indexOf(tag); 
	if(index != -1)
		cTags.splice(index,1);
	dict[root][word][1] = cTags;

	highlightWord(root);

	return cTags;
}

function delTag(tag){
	if(deletedTags.indexOf(tag) == -1)deletedTags.push(tag);
	return deletedTags;
}

function isUpperWord(word){
	return word.match(/\b([A-Z]+)\b/g) == undefined ? false : true; 
}

function updateTagResult(){
	document.getElementById("resultarea").innerHTML = JSON.stringify(wordTag);
    document.getElementById("content_dict_area").innerHTML = 
                                        "<p></p>"+JSON.stringify(wordInfoDict);
}
function combineTag(small,large){
	
}

function combineInfo(small,large){
	for(var entity in small){
		if(!small.hasOwnProperty(entity))continue;
		var sub_small = small[entity];
		for(var word in sub_small){
			if(!sub_small.hasOwnProperty(word))continue;
			//var root = stemmer(word);
			var root = entity;
			if(!large.hasOwnProperty(root)){
				large[root] = {};
				large[root][word] = [0,[]];
			}else{
		        if (large[root][word] == undefined){ 
		        	large[root][word] = [0,[]];
		        }		
			}
			/*combine count*/
			large[root][word][0] += sub_small[word][0];
			/*combine tag*/
			large[root][word][1] = combineNewTag(large[root][word][1],
												sub_small[word][1]);		
		}
	}

	return large;
}

function assignTagsBy(word,givenTags){
	var root = stemmer(word);
	var cTags;
	if(tagsInfo[root] != null && tagsInfo[root][word] != null)
		cTags = tagsInfo[root][word][1];
		

	var tags;
	if(cTags == null)
		tags = $("#auto-classify").val().split(',');
	else
		tags = intersect_safe(cTags,givenTags);

	wordInfoDict[root][word][1] = tags;

	return true;
}

function highlightBy(givenTags){
	hightlightText('undefined','undefined');

	var invertTags = invertTagsInfo(wordInfoDict,1);

	for(var i in givenTags){
		var tag = givenTags[i];
		var color = getTagColorEx(tag);
		var words = invertTags[tag];
		if(words == null)continue;
		hightlightText(words,color);
	}
}

function save(){	
	allMyTagInfo = combineInfo(wordInfoDict,tagsInfo);
	var title = getContentTitle();
	var html  = getContentView();
	var cate  = getContentCate();
	var fingerprint = getContentFingerPrint();

	if(content != null)
		addDoc(title,cate,content,html,fingerprint);
	/*console.log(allMyTagInfo);*/

/*		localStorage.setItem(tagKey,JSON.stringify(allMyTagInfo));
	localStorage.setItem(docKey,JSON.stringify(docs));
	localStorage.setItem(crumbKey,JSON.stringify(crumbs));
	localStorage.setItem(deletedTagKey,JSON.stringify(deletedTags));*/

	_couchDb.mergeWti(wi.toJson());
	_couchDb.postCrumbs(crumbs);
	if(!_couchDb.docExists){
		_couchDb.postDoc(docs[0]);
	}	
}

function saveEx(){
	if(!_couchDb.docExists)
		_couchDb.mergeWti(wi.toJson(),wi_del.toJson(),doctor.getDoc());
	else{
		doctor.wordArray = Object.keys(wi._wti);
		_couchDb.mergeWti(wi.toJson(),wi_del.toJson(),doctor.getDoc(
																	[
																	'doc_id',
																	'doc_words',
																	'doc_date']
																	)
						);
	}
	//_couchDb.updateCrumbs(tagger._crumbs);
	//if(!_couchDb.docExists)_couchDb.postDoc(doctor.getDoc());
}

function engrow_init(){
	USER_ID = docCookies.getItem('uhash');
}

$(document).ready(function(){
	var tagKey   = 'all_my_tag_info';
	var docKey 	 = 'all_my_doc_info';
	var crumbKey = 'all_my_crumb_info';
	var deletedTagKey = 'all_deleted_tag_info';

	//docString = localStorage.getItem(docKey);
	//if(docString != null)docs = JSON.parse(docString);
	//crumbString = localStorage.getItem(crumbKey);
	//if(crumbString != null)crumbs = JSON.parse(crumbString);
	//tagsInfoString = localStorage.getItem(tagKey);
	//if(tagsInfoString != null)tagsInfo = JSON.parse(tagsInfoString);
	//deletedTagString = localStorage.getItem(deletedTagKey);
	//if(deletedTagString != null)deletedTags = JSON.parse(deletedTagString);

	if(!NO_WTI){
		//_couchDb.getLastWti();
	}else{
		var source = localStorage.getItem(tagKey);
		if(source == '' || typeof(source) == 'undefined' || source == null)
			localStorage.setItem(tagKey,'');
		else
			tagsInfo = JSON.parse(source);
	}

	$("#saveTagInfo").on('click',function(){
		save();
	});
	$("#clearTagInfo").on('click',function(){
		localStorage.removeItem(tagKey);
		localStorage.removeItem(docKey);
		localStorage.removeItem(crumbKey);
	});
	$("#outputTagInfo").on('click',function(){
		var allMyTagInfo = localStorage.getItem(tagKey);
		allMyTagInfo = JSON.parse(allMyTagInfo);

		console.log(allMyTagInfo);
	});
	$("#submitRemove").on('click',function(){
		var val = $("#removeTag").val().split(':');

		var word = val[0];
		var tag  = val[1];
		var root = stemmer(word);

		removeTag(word,tag,wordInfoDict);
		removeTag(word,tag,tagsInfo);
		
		addCrumb(root,word,tag,docId,0);
	});
	$("#commitAssign").on('click',function(){
		var tags = $("#assignTags").val().split(',');
		for(var i in wordArray){
			var word = wordArray[i];
			assignTagsBy(word,tags);
		}

	});
	$("#highlight").on('click',function(){
		var tags = $("#highlightsTags").val().split(',');
		highlightBy(tags);
	});
	
});

engrow_init();