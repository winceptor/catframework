var router = require('express').Router();

var iconhost = ["http://cdn.steamcommunity.com/economy/emoticon/",""];
var iconhost = ["https://buildkiteassets.com/emoji/",".png?v1"];

var gethtmlfor = function(tag, tagcontent, alt)
{
	var alt = alt || tagcontent;
	var htmlcode = "";
	var action = false;
	if (tag =="noparse" || tag=="html")
	{
		htmlcode = tagcontent;
	}
	if (tag =="icon")
	{
		htmlcode = "<img src='" + iconhost[0] + tagcontent + iconhost[1] + "' class='icon' name='" + tagcontent + "' alt='" + alt + "' onerror='imageerror(this);'>";
	}
	if (tag =="sp" || tag=="spoiler")
	{
		tag = "sp";
		htmlcode = '<div class="spoiler">' + tagcontent + '</div>';
	}
	if (tag =="autoparse")
	{
		var pattern1 = /\.mp3|\.wav|\.ogg|dl\.my\-hit\.com\//i;
		var pattern2 = /\.mp4|\.webm|\.webp|\.mkv|\.avi|\.m3u8/i;
		var pattern3 = /\.svg|\.png|\.jpg|\.jpeg|\.gif|\.apng|\.steamusercontent\.com\/ugc\//i;
		var pattern4 = /\.swf|\.flv/i;
		var pattern5 = /youtube\.com\/watch\?/ig;
		var pattern6 = /soundcloud\.com/ig;
		var pattern7 = /twitter\.com\//ig;
		var pattern8 = /youtu\.be\//ig;
		var result1 = tagcontent.match(pattern1);
		var result2 = tagcontent.match(pattern2);
		var result3 = tagcontent.match(pattern3);
		var result4 = tagcontent.match(pattern4);
		var result5 = tagcontent.match(pattern5);
		var result6 = tagcontent.match(pattern6);
		var result7 = tagcontent.match(pattern7);
		var result8 = tagcontent.match(pattern8);
		if (result1)
		{
			tag = "audio";
		}
		else if (result2)
		{
			tag = "video";
		}
		else if (result3)
		{
			tag = "image";
		}
		else if (result4)
		{
			tag = "flash";
		}
		else if (result5 || result8)
		{
			tag = "media";
		}
		else if (result6)
		{
			tag = "sc";
		}
		else if (result7)
		{
			//tag = "tw";
			tag = "url";
		}
		else
		{
			//console.log("tagcontent:" + tagcontent);
			tag = "url";
		}
	}
	if (tag =="url")
	{
		var urlname = tagcontent;
		
		var nameparts = tagcontent.split("#");
		
		var cleanurl = nameparts[0].split("?")[0];
		
		if (cleanurl.slice(-1)=="/")
		{
			cleanurl = cleanurl.slice(0, -1);
		}
		
		var protocolparts = cleanurl.split("://");
		
		if (protocolparts.length>1)
		{
			//keep protocol
			//cleanurl = protocolparts[1];
		}
		
		var urlparts = cleanurl.split("/");
		
		if (nameparts.length>1 && nameparts[1].length>0)
		{
			urlname = nameparts[1].replace(/_/g, ' ');
		}
		else
		{
			//urlname = urlparts[urlparts.length-1];
			urlname = cleanurl;
		}
		if (urlname.length==0)
		{
			urlname = cleanurl;
		}

		htmlcode = '<a class="link" href="' + tagcontent + '" target="_blank">' + urlname + '</a>';
	}
	if (tag =="wrap" || tag =="video" || tag =="vid" || tag =="webm" || tag =="audio" || tag =="track" || tag =="img" || tag =="image" || tag =="media" || tag =="flash" || tag =="tw" || tag =="sc" || tag =="spimg" || tag =="nsfw")
	{
		if (tag =="webm" || tag =="vid" || tag =="video")
		{
			htmlcode = '<div class="wrappercontent embed" ><video controls loop src="' + tagcontent + '">Your browser does not support the video tag.</video></div>';
		}
		if (tag =="audio" || tag =="track")
		{
			htmlcode = '<div class="wrappercontent" ><audio controls loop width="640" src="' + tagcontent + '">Your browser does not support the audio tag.</audio></div>';
		}
		if (tag =="media")
		{
			var embedurl = tagcontent.split("v=");
			htmlcode = "Error parsing youtube link.";
			if (embedurl[1])
			{
				var embedparts = embedurl[1].split("&");
				var embedv = embedparts[0];
				embedparts.shift();
				embedurl = embedparts.join("&");
				if (embedparts.length>0)
				{
					embedparts = "&" + embedparts;
				}

				if (embedv)
				{
					htmlcode = '<div class="wrappercontent embed"><iframe src="http://www.youtube.com/embed/' + embedv + '?autoplay=0' + embedparts + '" allowfullscreen></iframe></div>';
				}
			}
		}
		if (tag =="flash")
		{
			var embedurl = tagcontent.split(".swf");
			htmlcode = "Error parsing flash link.";
			if (embedurl[0])
			{
				action = '<div class="wrappercontent embed" ><object type="application/x-shockwave-flash" data="' + embedurl[0] + '.swf" width="100%" height="100%"><param name="movie" value="' + embedurl[0] + '.swf" /><param name="quality" value="high"/></object></div>';
			}
		}
		
		if (tag =="sc")
		{
			var soundcloud = tagcontent;
			tagcontent = soundcloud;
			if (tagcontent.length>0)
			{
				var scurl = 'http://api.soundcloud.com/resolve.json?url=' + soundcloud + '&client_id=386b66fb8e6e68704b52ab59edcdccc6';
			
				action = '<div class="wrappercontent soundcloud" >' + scurl + '</div>';
			}
		}
		
		if (tag =="tw")
		{
			htmlcode = "Error parsing twitter link.";
			if (tagcontent.length>0)
			{
				var twurl = 'https://publish.twitter.com/oembed?url=' + tagcontent;
				
				action = '<div class="wrappercontent twitter" >' + twurl + '</div>';
			}
		}
		
		if (tag =="img" || tag =="image")
		{
			htmlcode = "<img src='" + tagcontent + "' class='resizeable thumbnailimage' alt='" + tagcontent + "' onerror='imageerror(this);'>";
		}
		if (tag =="spimg")
		{
			htmlcode = "<img src='/img/spoiler.png' ssrc='" + tagcontent + "' class='resizeable spoiler thumbnailimage' onerror='imageerror(this);'>";
		}		
		if (tag =="nsfw")
		{
			htmlcode = "<img src='/img/nsfw.png' ssrc='" + tagcontent + "' class='resizeable nsfw thumbnailimage' onerror='imageerror(this);'>";
		}
		
		if (tag =="wrap" )
		{
			htmlcode = "<div class='textwrap' alt='" + tagcontent + "'>" + tagcontent + "</div>";
		}
		if (action)
		{
			htmlcode = "<div class='wrapper'><button class='unwrapper' action='" + action + "' ><span class='buttontext'>" + tagcontent + "</span></button></div>";
		}
		else
		{
			htmlcode = "<div class='wrapper'>" + htmlcode + "</div>";
		}
	}
	if (htmlcode.length<1)
	{
		var last = true;
		htmlcode = "[" + tag + "]" + tagcontent;
		if (!last)
		{
			htmlcode += "[/" + tag + "]";
		}
	}
	//htmlcode = "<span class='hidden'>" + alt + "</span>" + htmlcode;
	return htmlcode;
}


var parsecontent = function(textcontent)
{	

	var splitter = textcontent.split("]");
	
	var beforetags = "";
	var parsed = "";
	var aftertags = splitter[splitter.length-1];
	
	if (splitter.length>1)
	{
		splitter.pop();
		if (splitter) {
			var lastsplit = splitter[splitter.length-1];
			var toparse = splitter.join("]");
			var tagnamesplitter = toparse.split("[/");
			if (tagnamesplitter.length>1) {
				var tagname = tagnamesplitter[tagnamesplitter.length-1];
				tagnamesplitter.pop()
				if (tagnamesplitter)
				{
					var inparse = tagnamesplitter.join("[/");
					var tag = "["+tagname+"]";
					var tagcontentparts = inparse.split(tag);
					if (tagcontentparts.length>1) {
						var tagcontent = tagcontentparts[tagcontentparts.length-1];
						tagcontentparts.pop();
						parsed = gethtmlfor(tagname, tagcontent);
						if (tagcontentparts)
						{
							beforetags = parsecontent(tagcontentparts.join(tag));	
						}
					}
					else
					{
						parsed = inparse + "[/";
					}
				}
			}
			else
			{
				parsed = toparse + "]";
			}
		}
	}
	else
	{
		parsed = "";
	}
	
	return beforetags + parsed + parsetext(aftertags);
}

	
var parsetext = function(input) {
	var textlines = input.split(/\r\n|\r|\n/g);
	
	for (var v in textlines)
	{
		var textline = textlines[v];
		
		var textstrings = textline.split(" ");
		
		for (var k in textstrings)
		{
			var textstring = textstrings[k];
			var linksplitter = textstring.split("://");
			
			if (linksplitter.length>1)
			{//handle as link
				var protocol = linksplitter[0];
				var tagcontent = linksplitter[1];
				var htmlstring = gethtmlfor("autoparse", protocol + "://" + tagcontent, textstring);
				textstrings[k] = htmlstring;
			}
			else
			{//landle as icons
				var emoticonstring = parseemoticons(textstring);
				textstrings[k] = emoticonstring;
			}
		}
		
		textlines[v] = textstrings.join(" ");
	}
	var output = textlines.join("<br>");

	return output;
}

var parseemoticons = function(word) {
	/*var onetextline = textstrings.join(" ");
			
	var parsedemoticons = "";
	//var toparseemoticons = parsedlinktext;
	var words = onetextline.split(" ");

	for (var i in words) 
	{*/
		//var word = words[i];
		var emoticon = word;
		
		//var pattern1 = /:$/;
		//var pattern2 = /^:/;
		//var result = word.match(pattern1) && word.match(pattern2);
		
		var emoticons = "";
		var split = word.split(":");
		var j = 0;
		for (j = 0; j < split.length; j++) 
		{ 
			
			if ( j%2 == 1 && split.length>(j+1))
			{
				var url = iconhost + split[j];
				var iconname = split[j];
				emoticon = gethtmlfor("icon",iconname, word);
				
				/*if (ImageExist(url))
				{
					emoticon = gethtmlfor("icon",url);		
				}
				else
				{
					emoticon = gethtmlfor("icon",url);	
					//emoticon = ":" + emoticon + ":";
				}
				*/
			}
			else
			{
				if (j%2 == 1)
				{
					emoticon = ":" + split[j];
				}
				else
				{
					emoticon = split[j];
				}
			}
			emoticons = emoticons + emoticon;
		}
		/*
		if (i>0)
		{
			parsedemoticons = parsedemoticons + " " + emoticons;
		}
		else
		{
			parsedemoticons = emoticons;
		}
	}
	*/
	//textlines[v] = parsedemoticons;
	return emoticons;
}

var escapehtml = function(text){
	if (!text || text==null || text==undefined)
	{
		return "";
	}
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}


var parsehtml = function(message)
{
	var unparsed = message || '';
	var parsedhtml = parsecontent(unparsed);
	return parsedhtml || "";
}

var parsemessage = function(message)
{
	var escaped = escapehtml(message);
	var parsedmessage = parsecontent(escaped);
	return parsedmessage || "";
}


var catparsehelp = "<strong>Most things are parsed automatically! No need for tags, just write the link.<br>When posting links you can append </strong>#link_name_here <strong>to the link.</strong><br><strong>Example:</strong> http://exampleurl.com/somelink#Some_named_link <strong>makes a link with name:</strong> 'Some named link'.";	

var taghelp = {};
taghelp["url"] = "basic link";
taghelp["webm"] = "webm link";
taghelp["vid"] = "video link";
taghelp["video"] = "video link";
taghelp["audio"] = "audio link";
taghelp["media"] = "youtube link";
taghelp["image"] = "image link";
taghelp["img"] = "image link";
taghelp["sp"] = "spoiler text";
taghelp["spimg"] = "spoiler image link";
taghelp["nsfw"] = "nsfw image link";
taghelp["flash"] = "flash link";
taghelp["sc"] = "soundcloud link";
taghelp["wrap"] = "wrap text";
taghelp["noparse"] = "force unparsed text";

for (var tag in taghelp)
{
	catparsehelp += "<br><b>[" + tag + "]</b> " + taghelp[tag] + " <b>[/" + tag + "]</b>";
}
catparsehelp += "<br>";


router.use(function(req, res, next) {
	res.locals.escapehtml = escapehtml;
	res.locals.catparse = parsemessage;
	res.locals.catparsehelp = catparsehelp;
	next();
});

module.exports= router;