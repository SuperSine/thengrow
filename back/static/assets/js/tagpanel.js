//Author: langread.com

(function($,window,document,undefined){
	$.fn.tagpanel = function(options){
		var markSelectionId = "word_marker";
		var markSelector = "#" + markSelectionId;
		var valSelected = false;
  		var containerId;
  		var contentId;

		var defaults = {
			popovercontent:'<div><input class="form-control input-sm taginput"/></div>',
			taginput:'.taginput',
			detectarea:false,
			tagger:false

		};

		var options = $.extend({}, defaults, options);

		var randomId = function(prefix){
			return prefix + new Date().getTime() + "_" + Math.random().toString().substr(2);
		}

		var getSelectionDimensions = function (){
		    var sel = document.selection, range;
		    var width = 0, height = 0;
		    if (sel) {
		        if (sel.type != "Control") {
		            range = sel.createRange();
		            width = range.boundingWidth;
		            height = range.boundingHeight;
		        }
		    } else if (window.getSelection) {
		        sel = window.getSelection();
		        if (sel.rangeCount) {
		            range = sel.getRangeAt(0).cloneRange();
		            if (range.getBoundingClientRect) {
		                var rect = range.getBoundingClientRect();
		                width = rect.right - rect.left;
		                height = rect.bottom - rect.top;
		            }
		        }
		    }
		    return { width: width , height: height };
		}		

		/*mark the area which selected by getSelection()*/
		var markSelection = function() {
		    var markerTextChar = "\ufeff";
		    var markerTextCharEntity = "&#xfeff;";

		    var markerEl, markerId = "sel_" + new Date().getTime() + "_" + Math.random().toString().substr(2);

		    var selectionEl;

		    
		    var sel, range;
		    
		    if (document.selection && document.selection.createRange) {
		      // Clone the TextRange and collapse
		      range = document.selection.createRange().duplicate();
		      range.collapse(false);
		      
		      // Create the marker element containing a single invisible character by creating literal HTML and insert it
		      range.pasteHTML('<span id="' + markerId + '" style="position: relative;">' + markerTextCharEntity + '</span>');
		      markerEl = document.getElementById(markerId);
		    } else if (window.getSelection) {
		      sel = window.getSelection();
		      
		      if (sel.getRangeAt) {
		        range = sel.getRangeAt(0).cloneRange();
		      } else {
		        // Older WebKit doesn't have getRangeAt
		        range.setStart(sel.anchorNode, sel.anchorOffset);
		        range.setEnd(sel.focusNode, sel.focusOffset);
		        
		        // Handle the case when the selection was selected backwards (from the end to the start in the
		        // document)
		        if (range.collapsed !== sel.isCollapsed) {
		          range.setStart(sel.focusNode, sel.focusOffset);
		          range.setEnd(sel.anchorNode, sel.anchorOffset);
		        }
		      }
		      
		      range.collapse(false);
		      
		      // Create the marker element containing a single invisible character using DOM methods and insert it
		      markerEl = document.createElement("span");
		      markerEl.id = markerId;
		      markerEl.appendChild( document.createTextNode(markerTextChar) );
		      range.insertNode(markerEl);
		    }
		    
		    if (markerEl) {
		      // Lazily create element to be placed next to the selection
		      if (!selectionEl) {
		        selectionEl = document.createElement("div");
		        selectionEl.id = markSelectionId;
		        /*
		                  selectionEl.style.border = "solid darkblue 1px";
		                  selectionEl.style.backgroundColor = "lightgoldenrodyellow";
		                  selectionEl.innerHTML = "&lt;- selection";
		                  */
		        selectionEl.style.position = "absolute";
		        
		        document.body.appendChild(selectionEl);
		      }
		      
		      // Find markerEl position http://www.quirksmode.org/js/findpos.html
		      var obj = markerEl;
		      var left = 0, top = 0;
		      do {
		        left += obj.offsetLeft;
		        top += obj.offsetTop;
		      } while (obj = obj.offsetParent);
		      
		      // Move the button into place.
		      // Substitute your jQuery stuff in here
		      selectionEl.style.left = (left - (getSelectionDimensions()['width']/2)) + "px";
		      selectionEl.style.top = top + "px";
		      
		      markerEl.parentNode.removeChild(markerEl);
		    }

		    return sel.toString();
		    
		};

		var showTagPanel = function(){

			if (document.querySelector(".popover")) {
			    $("#"+containerId).append($("#"+contentId));
			}

			$(markSelector).popover({
		      animation:false,
		      html: true,
		      placement:'top',
		      content: function(){ return $("#"+contentId);},
		      trigger:'manual'
		  	});

			$(markSelector).popover("show");

		};

		var hideTagPanel = function(){
    		$("#"+containerId).append($("#"+contentId));
    		$(markSelector).popover("hide");
  		};

  		var createContainer = function(){
  			containerId = randomId('ctr');
  			contentId   = randomId('cnt');
  			var html = String.format('<div id="{0}" style="display:none;"><div id="{1}"><input class="form-control input-sm taginput"/></div></div>',containerId,contentId);
  			$('body').append(html);
  		};

		var initTagsInput = function(tagger){
		    if(!tagger.getTagsArray())return;

		    createContainer();

		    var substringMatcher = function(objs) {
		      return function findMatches(q, cb) {
		        var matches, substringRegex;

		        // an array that will be populated with substring matches
		        matches = [];

		        // regex used to determine if a string contains the substring `q`
		        substrRegex = new RegExp(q, 'i');

		        // iterate through the pool of strings and for any string that
		        // contains the substring `q`, add it to the `matches` array
		        $.each(objs, function(i, obj) {
		          if (substrRegex.test(obj.name)) {
		            // the typeahead jQuery plugin expects suggestions to a
		            // JavaScript object, refer to typeahead docs for more info
		            matches.push(obj);
		          }
		        });

		        cb(matches);
		      };
		    };

		  $(options.taginput).tagsinput({
		    itemValue: 'key',
		    itemText: 'name'
		  });
		  //$('.bigbian').tagsinput('add', { "value": 1 , "text": "Amsterdam"   , "continent": "Europe"    });

		   
		  $(options.taginput).tagsinput('input').typeahead({
		    hint: true,
		    highlight: true,
		    minLength: 1
		  },
		  {
		    name: 'dataset',
		    displayKey: 'name',
		    source: substringMatcher(tagger.getTagsArray())
		  }).bind('typeahead:selected', $.proxy(function (obj, datum) {
		    valSelected = true;
		    this.tagsinput('add', datum);
		    this.tagsinput('input').typeahead('resetInputValue');
		    //$("#popoverContentContainer").append($("#popoverContent1"));
		    //hideTagPanel();
		    showTagPanel();
		  }, $(options.taginput)));  
		}  		

		/*注册双击显示tagpanel事件*/
        $(options.detectarea).on('dblclick',function (e) {
        	if(!document.querySelector(".popover")){
              var obj = document.querySelector(markSelector);

              if(obj)obj.remove();

              selectedText = markSelection();

              $(options.taginput).tagsinput('removeAll');

              var tagsArray = options.tagger.getTags(selectedText);

              tagsArray.forEach(function(key){
                if(!key)return;
                $(options.taginput).tagsinput('add', { "key": key , "name":  options.tagger.getTagName(key) });
              });
              
              showTagPanel();
          }
        });  		

        /*注册单击取消tagpanel事件*/
        $(options.detectarea).on('click',function (e) {
        	if(document.activeElement.parentNode.className == 'twitter-typeahead' || valSelected){valSelected = false;return;}

            if (document.querySelector(".popover")) {
                var tags = $(options.taginput).val();
                options.tagger.setTag(selectedText,tags);
                hideTagPanel();
            }
          valSelected = false;
        });           

        initTagsInput(options.tagger);

	};
})(jQuery,window,document);