function(doc,req){
    WordInfo = require("lib/WordInfo");
    var wordInfo = new WordInfo();
    return [doc,wordInfo.constructor.name];
}


{
   "merge": "function(e,t){var n=0;this.getNewTag=function(e,t){if(t!=null&&e.indexOf(t)==-1)e.push(t);return e};this.combineNewTag=function(e,t){var n=e;for(var r in t){n=this.getNewTag(n,t[r])}return n};this.combineInfo=function(e,t){for(var r in e){if(!e.hasOwnProperty(r))continue;var i=e[r];for(var s in i){if(!i.hasOwnProperty(s))continue;var o=r;if(!t.hasOwnProperty(o)){t[o]={};t[o][s]=[0,[]]}else{if(t[o][s]==undefined){t[o][s]=[0,[]]}}t[o][s][0]+=i[s][0];t[o][s][1]=this.combineNewTag(t[o][s][1],i[s][1]);n+=1}}return t};var r=JSON.parse(t.query.word_tag_info);e.word_tag_info=this.combineInfo(r,e.word_tag_info);return[e,n.toString()]}",
"mergeEx":"function(doc,req){return[doc,123]}"
}


function(doc,req){
    var lib = require('WordInfo');
    var info = JSON.parse(req.query.word_tag_info);
    var last = new lib.WordInfo(info);
    var old  = new lib.WordInfo(doc.word_tag_info);
    last.reverse(1);
    old.merge(last);

    doc.word_tag_info = old.toJson();
    return [doc,JSON.stringify(doc.word_tag_info)];
}

function(doc,req){
    var lib = require('WordInfo');
    var last = new lib.WordInfo(req.query.word_tag_info_1);
    var del  = new lib.WordInfo(req.query.word_tag_info_2,false);
    var qDoc = JSON.parse(req.query.doc);
    last.reverse(1);
    del.reverse(1);
    var old = new lib.WordInfo(doc.word_tag_info);
    var items_affected = old.merge(last);
    items_affected += old.merge(del);
    doc.word_tag_info = old.toJson();
    if(doc.doc)
        doc.doc.push(qDoc);
    else{
        doc.doc = [qDoc];
    }
    if(req.query.id)doc._id = req.query.id;
    return [doc,items_affected.toString()];
}

function(doc) {
  if(doc.doc){
    var docs = [];
    if(doc.docs)docs = docs.concat(doc.docs);
    else docs.push(doc);
  
    for(var i in docs){
      var date = new Date(docs[i].time*1000);
      emit([date.getFullYear(),date.getMonth()+1,date.getDate(),docs[i].word],docs[i].word);
    }
  }
}

function(doc) {
  if(doc.type == 'words' && doc.doc){
    for(var i in doc.doc){
        var words = doc.doc[i].doc_words;
        var date = new Date(doc.doc[i].doc_date*1000);
        for(var j in words){
            emit([date.getFullYear(),date.getMonth()+1,date.getDate(),words[j]],words[j]);
        }
    }
  }
}

function(doc,req){
var lib=require('WordInfo');
var last = new lib.WordInfo(req.query.word_tag_info);
last.reverse(1);
var old=new lib.WordInfo((doc.word_tag_info));
var items_affected = old.merge(last);
doc.word_tag_info = old.toJson();
return[doc,items_affected.toString()];};

function(doc,req){
var s = '';
for(var i = 0; i < 110*1024; ++i)s += '0123456789';
doc.s += s;
return[doc,doc.s.length.toString()];
}

function(doc,req){return [{'_id':new Date().getTime()*Math.random(1,100)},""];}

/*mergeWti*/
function(doc,req){
req.body = JSON.parse(req.body);
var lib=require('WordInfo');
var last=new lib.WordInfo(req.body.word_tag_info_1);
var del=new lib.WordInfo(req.body.word_tag_info_2,false);
var qDoc=null;
if(req.body.doc)qDoc = JSON.parse(req.body.doc);
last.reverse(1);del.reverse(1);
var old = null;
if(!doc){
    doc = {};
    old=new lib.WordInfo();
}else
    old=new lib.WordInfo(doc.word_tag_info);
var items_affected=old.merge(last);
items_affected+=old.merge(del);
doc.word_tag_info=old.toJson();
if(doc.doc && qDoc){doc.doc.push(qDoc)}else{doc.doc=[qDoc]};
if(req.body.id){delete doc._rev;delete doc._revisions;var nDoc = doc.doc.pop();if(nDoc)doc.doc=[nDoc];else doc.doc=null;doc.timestamp=req.body.timestamp;}else{newDoc=doc;}
doc._id=req.body.id;
doc.type = req.body.type;
return[doc,items_affected.toString()]};

/*mergeTag*/
function(doc,req){
    req.body = JSON.parse(req.body);
    var tags = req.body.tags;
    var keys = Object.keys(tags);
    if(doc){
        keys.forEach(
            function(e){
                if(!doc.tags[e])doc.tags[e] = tags[e];
            }
        );    
    }else{
        doc = {'_id':req.body.id,'type':req.body.type,'tags':req.body.tags};
    }

    return [doc,JSON.stringify(doc)];
}

/*by_word*/
function(doc) {
  if(doc.type == 'words'){
    var newDocs = doc.doc;
    var lib = require('views/lib/stemmer');
    for(var i in newDocs){
        var words = newDocs[i].doc_words;
        var date = new Date(newDocs[i].doc_date*1000);
        for(var j in words){
            for(var tag in doc.word_tag_info){
                var exist = doc.word_tag_info[tag][words[j]];
                if(exist)
                    emit([lib.stemmer(words[j]),tag],null);
                else
                    emit([lib.stemmer(words[j])],null);
            }
        }
    }
  }
}
