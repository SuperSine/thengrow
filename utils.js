function intersect(x, y){
	var sX = x.sort();
	var sY = y.sort();

	return intersect_safe(sX,sY);   
}

function intersect_safe(a, b)
{
  var ai=0, bi=0;
  var result = new Array();

  while( ai < a.length && bi < b.length )
  {
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else /* they're equal */
     {
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }

  return result;
}


function uniqid(){
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c){
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function gc(length){
  var s = '';
  if(length){
    for(var i = 0; i < length;++i)s+='x';
  }else{
    s = 'xxxxxxxxxxx';
  }
  return s.replace(/x/g,function(c){
    var code = "ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz123456789";
    return code.charAt(Math.random()*code.length-1)
  });
}

