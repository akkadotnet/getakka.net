$(function() {
	$('#toc').toc({
		'listType': '<ul class="side-nav list-group toc-container" />',
		'selectors': 'h1,h2,h3', //elements to use as headings
		'container': '#main_content', //element to find all selectors in
		'headerText': function(i, heading, $heading) { //custom function building the header-item text
		return $heading.text();
	    },
		'itemClass': function(i, heading, $heading, prefix) { // custom function for item class
		  return "toc toc-" + $heading[0].tagName.toLowerCase();
		},
		activeClass: "toc-active"
	});

	$.getJSON("http://cdn.syndication.twimg.com/widgets/timelines/495982116597796864?dnt=true&domain=unquietcode.com&lang=en&callback=?", function(data) {
	    var tweets = $(data.body).find('li.tweet');
	    Tweets = [];

	    for (var i=0; i < tweets.length; ++i) {
	      var cur = $(tweets[i]);
	      var tweet = {};
	      tweet.authorImg = cur.find("img").attr("src");
	      tweet.authorFullName = cur.find("span.full-name span.p-name").html();
	      tweet.authorUserName = cur.find("span.p-nickname b").html();
	      tweet.date = cur.find("a.u-url").attr("data-datetime");
	      tweet.id = cur.attr("data-tweet-id");
	      tweet.text = $.trim(cur.find("p.e-entry-title").html());

	      Tweets.push(tweet);
	      if (i>=3)
	      	break;
	    }
	    console.info(Tweets);

	    var tweetsContainer = $('#recent_tweets')
	    $.each(Tweets, function(i)
	    {
	        var li = $('<li/>')
	            .appendTo(tweetsContainer);

	    	$('<i class="fa fa-twitter"/>')
	            .appendTo(li);

	        $('<a/>')
	        	.attr('href', 'https://twitter.com/' + Tweets[i].authorUserName)
	        	.html('<strong> @' + Tweets[i].authorUserName + ": </strong>")
	            .appendTo(li);

	        $('<span/>')
	            .html(Tweets[i].text)
	            .appendTo(li);
	    });




	});

	var main = $("#main_content");

	$.get( "/pages.html", function( data ) {
		var files = JSON.parse( data ).pages;
		console.info(files);
		var codes = main.find("code").filter(function() {
			return $.inArray($(this).text(), files) != -1;
		});
		codes.replaceWith(function() {
		    var file = $.trim($(this).text());
		    return '<code><a href="/docs/' + file + '" >^' + file + '</a></code>';
		});
	});
});


(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-59199804-1', 'auto');
ga('send', 'pageview');
