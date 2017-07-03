
var ImageExist = function(url) 
{
   var img = new Image();
   img.src = url;
   return img.height != 0;
}

function imageerror(object)
{
//$(document).on('error', '.icon', function() {
	//console.log("found error icon");
	if ($(object).hasClass("icon"))
	{
		var text = ":" + $(object).prop('name') + ":";
		$(object).replaceWith(text);
	}
	else
	{
		//$(object).attr('src', 'error.png');
		var src = $(object).prop('src');
		var link = "<a href='" + src + "' target='_blank'>" + src + "</a>";
		$(object).parent(".wrapper").replaceWith(link);
	}
}


$(document).ready(function(){
    $(document).on('click', '.spoiler', function() {
		//$(this).css("color","white");
		this.style.color = this.style.color == 'white' ? 'black' : 'white';
	});
	
	var playpause = function(obj)
	{
		obj.paused?obj.play():obj.pause();
	}
	$(document).on('click', 'video', function(){playpause(this)});
	$(document).on('click', 'audio', function(){playpause(this)});

	$(document).on('click', '.unwrapper', function() {
		if ($(this).prop("open")!="true")
		{
			$(this).prop("open","true");

			var wrapper  = $(this).parent();

			$(wrapper).append($(this).attr("action"));
			var content = $(wrapper).children(".wrappercontent")[0];
			$(content).hide();
			$(content).fadeIn('fast', function(){
				if ($(content).hasClass("soundcloud"))
				{
					var apiurl = $(content).text();
					//console.log("soundcloud loading");
					$.ajax({
						url: apiurl,
						dataType: 'json',
						success: function(result) {
						   //alert(result.uri);
						   var newcontent = '<iframe width="500" height="166" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=' + result.uri + '&amp;color=ff5500&amp;auto_play=false&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false"></iframe>';
						   $(content).html(newcontent);
						}
					});
				}
				else if ($(content).hasClass("twitter"))
				{
					var apiurl = $(content).text();
					//console.log("soundcloud loading");
					$.ajax({
						url: apiurl,
						dataType: 'json',
						success: function(result) {
						   //alert(result.uri);
						   var newcontent = result.html;
						   $(content).html(newcontent);
						}
					});
				}
				else
				{

				}
			});

			
		}
		else
		{
			var wrapper  = $(this).parent();
			var content = $(wrapper).children(".wrappercontent")[0];
			$(this).prop( "open", "false" );
			//var content = $(wrapper).children();
			$(content).fadeOut('fast', function(){
					$(content).remove();
			});
		}
	});
	
	$(document).on('click', '.resizeable', function() {
		if ($(this).prop("open")!="true")
		{
			$(this).prop("open","true");
			$(this).addClass( "expandedimage" );
			$(this).removeClass( "thumbnailimage" );
			
			if ($(this).hasClass( "spoiler" ) || $(this).hasClass( "nsfw" ))
			{
				var src = $(this).attr("src");
				var ssrc = $(this).attr("ssrc");
				$(this).attr('src', ssrc);
				$(this).attr('ssrc', src);
			}
			$(this).hide();
			$(this).fadeIn('fast', function(){
	
			})
		}
		else
		{
			$(this).fadeOut('fast', function(){
				$(this).prop( "open", "false" );
				$(this).addClass( "thumbnailimage" );
				$(this).removeClass( "expandedimage" );

				var src = $(this).attr("src");
				var ssrc = $(this).attr("ssrc");
				$(this).attr('src', ssrc);
				$(this).attr('ssrc', src);
				$(this).show();
			});


		}
		
	});
});