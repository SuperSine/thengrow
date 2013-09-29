function Docs(){
	$.couch.urlPrefix = (url ? url:"http://sre.cloudant.com:5984");

	this.getInstance = function(){
		return $.couch;
	}

	this.fetchDocs = function(){

	}
}