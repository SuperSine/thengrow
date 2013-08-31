/*
 
highlight v3 - Modified by Marshal (beatgates@gmail.com) to add regexp highlight, 2011-6-24
 
Highlights arbitrary terms.
 
<http://johannburkard.de/blog/programming/javascript/highlight-javascript-text-higlighting-jquery-plugin.html>
 
MIT license.
 
Johann Burkard
<http://johannburkard.de>
<mailto:jb@eaio.com>
 
*/
 
jQuery.fn.highlight = function(pattern,color,id) {
    var regex = typeof(pattern) === "string" ? new RegExp(pattern, "i") : pattern; // assume very LOOSELY pattern is regexp if not string
    function innerHighlight(node, pattern) {
        var skip = 0;
        if (node.nodeType === 3) { // 3 - Text node
            var pos = node.data.search(regex);
            if (pos >= 0 && node.data.length > 0) { // .* matching "" causes infinite loop
                var match = node.data.match(regex); // get the match(es), but we would only handle the 1st one, hence /g is not recommended
                var spanNode = document.createElement('span');
                spanNode.style.backgroundColor="rgba("+color+")";
				//spanNode.attributes["thgtagword"]=match[0];
			spanNode.id= id;
		        //spanNode.className = 'highlight'; // set css
				/*splitText(offset) Splits the text node into two pieces at character position offset.
				A new text node containing the right half of the text is returned 
				and the corresponding text is removed from the node. (IE6+, MOZ/N6+, DOM1)*/
                var middleBit = node.splitText(pos); // split to 2 nodes, node contains the pre-pos text, middleBit has the post-pos
                var endBit = middleBit.splitText(match[0].length); // similarly split middleBit to 2 nodes
                var middleClone = middleBit.cloneNode(true);
                spanNode.appendChild(middleClone);
                // parentNode ie. node, now has 3 nodes by 2 splitText()s, replace the middle with the highlighted spanNode:
                middleBit.parentNode.replaceChild(spanNode, middleBit); 
                skip = 1; // skip this middleBit, but still need to check endBit
            }
        } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) { // 1 - Element node
            for (var i = 0; i < node.childNodes.length; i++) { // highlight all children
                i += innerHighlight(node.childNodes[i], pattern); // skip highlighted ones
            }
        }
        return skip;
    }
     
    return this.each(function() {
        innerHighlight(this, pattern);
    });
};
 
jQuery.fn.removeAllHighlight = function() {
    return this.find("#2ebDPFF").each(function() {
        this.parentNode.firstChild.nodeName;
        with (this.parentNode) {
            replaceChild(this.firstChild, this);
            normalize();
        }
    }).end();
};
jQuery.fn.removeHighlight = function(pattern,id) {
    return this.find("#"+id).each(function() {
        this.parentNode.firstChild.nodeName;
        with (this.parentNode) {
			var regex = typeof(pattern) === "string" ? new RegExp(pattern, "i") : pattern;
			if(this.firstElementChild != undefined && this.firstElementChild.id==id)
				replaceChild(this.firstElementChild,this);
			else if(this.firstChild.data.match(regex)!=undefined)
				replaceChild(this.firstChild, this);
			normalize();
        }
    }).end();
};