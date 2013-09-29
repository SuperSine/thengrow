big = function(keys,values,rereduce){
	this.getNewTag = function(body,tag){
		if(tag != null && body.indexOf(tag) == -1)body.push(tag);
		return body;
	}

	this.combineNewTag = function(list1,list2){
		var combo = list1;
		for(var i in list2){
			combo = this.getNewTag(combo,list2[i]);
		}

		return combo;
	}

	this.combineInfo = function(small,large){
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
				large[root][word][1] = this.combineNewTag(large[root][word][1],
													sub_small[word][1]);		
			}
		}

		return large;
	}	

	if(rereduce){
		var large = {};
		for(var i in values){
			var small = values[i];
			large = this.combineInfo(small,large);
		}
		return large;
	}
	return values;
}


bigbian = function (doc,req){
var inc_amount = parseInt(req.query.incr_weight);
                         doc.max_weight = doc.max_weight + inc_amount;
                         return [doc, "I incremented " +
                                      doc._id + " by " +
                                      inc_amount];
}

smallbian = function(doc,req){
	var count = 0;
	this.getNewTag = function(body,tag){
		if(tag != null && body.indexOf(tag) == -1)body.push(tag);
		return body;
	}

	this.combineNewTag = function(list1,list2){
		var combo = list1;
		for(var i in list2){
			combo = this.getNewTag(combo,list2[i]);
		}

		return combo;
	}

	this.combineInfo = function(small,large){
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
				large[root][word][1] = this.combineNewTag(large[root][word][1],
													sub_small[word][1]);	
				count += 1;	
			}
		}

		return large;
	}	

	var new_wti = JSON.parse(req.query.word_tag_info);
	doc.word_tag_info = this.combineInfo(new_wti,doc.word_tag_info);

	return [doc,count.toString()];
}
