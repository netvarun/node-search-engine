var host_to_crawl = "wikipedia.org";

var unique = function(arr) {
    var a = [];
    var l = arr.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (arr[i] === arr[j])
          j = ++i;
      }
      a.push(arr[i]);
    }
    return a;
};

function indexInArray(arr, val){
    for (var i = 0; i < arr.length; i++) { 
	    if(arr[i]==val) return true;
    }
    return false;
}

var libxml = require("./libxmljs"),
    http = require("http"),
    url = require("url"),
    sys = require("sys");

var target_site = http.createClient(80, host_to_crawl);

var parsePage = function(string) {
    try {	
        var parsed = libxml.parseHtmlString(string);
    } catch(e) {
	sys.puts('Cannot parse: ' + string);
	return [];
    }

//    sys.puts(parsed.encoding());
    var links = parsed.find('//a');
    var destinations = [];
    for (link in links) {
        var attr = links[link].attr('href');
        if (attr && attr.value) {
            var url_parts = url.parse(attr.value());

	    if (!url_parts.hostname || url_parts.hostname.indexOf(host_to_crawl) > -1) {
            	destinations.push(url_parts.pathname);
	    } else {
		sys.puts('Found outbound link to ' + url_parts.hostname);
	    }
        }
    }

    return destinations;
};

var getPage = function(URL, callback) {

    var request = target_site.request("GET", URL, {"host": host_to_crawl});

    request.addListener('response', function (response) {
      response.setBodyEncoding("utf8");

      var text = '';

      response.addListener("data", function (chunk) {
          text += chunk;
      });

      response.addListener('end', function() {
          callback(text);
      });

    });
    request.close();
};

var known_pages = [];

var visited_pages = [];

var get_next_page = function() {
    for (page in known_pages) {
        if (known_pages[page] && !indexInArray(visited_pages, known_pages[page])) {
            visited_pages.push(known_pages[page]);
            sys.puts('Visited pages: ' + visited_pages.length);
            return known_pages[page];
        }
    }
}

var crawl_page = function(URL) {
    sys.puts('Visiting ' + URL);
    getPage(URL, function(text) {
        var links = parsePage(text);
        known_pages = unique(known_pages.concat(links));
        sys.puts('Known pages: ' + known_pages.length);
        crawl_page(get_next_page());
    });
}

crawl_page('/');
