MaestroApi = function() {
}

//from http://stackoverflow.com/questions/2219526/how-many-bytes-in-a-javascript-string
function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}

function urlOnly(url) {
	return url.split("?")[0];
}

function makeGoodPath(urlEncoded) {
	return decodeURIComponent(urlEncoded).replace(/\+/g, ' ');
}

function getQueryStringParameters(url) {
	var parts = url.split("?");
	var result = {};
	if(parts.length>1) {
		var qs = parts[1];
		var qsParts = qs.split("&");
		for(var i=0; i<qsParts.length; i++) {
			var paramParts = qsParts[i].split("=");
			result[paramParts[0]] = makeGoodPath(paramParts[1] || '').replace(/\+/g, ' ');
		}
	}
	return result;
	
}
var maestroFolders = new MaestroFolders();

var chunkSize = 2000000;

function stream(path,start,end,req, keepGoing) {

	maestroFolders.getFileContents(path, start, end, function(contents, totalSize) {
		if(end>=totalSize) {
			end = totalSize-1;
		}
		var headers = {
			"Accept-Ranges": "bytes",		
			"Access-Control-Allow-Origin":"*",
			"Access-Control-Allow-Methods":"POST, GET, OPTIONS, PUT, DELETE, HEAD",
			"Access-Control-Allow-Headers":"X-PINGOTHER, Origin, X-Requested-With, Content-Type, Accept, Accept-Encoding, Range",
		}
		var status = 206;
		if(!keepGoing) {
			status = 206;
			headers['Content-Length']= end-start;
			headers['Content-Range'] = 'bytes '+start+"-"+end+"/"+totalSize;
		} else {
			headers['Content-Length']= totalSize;
			headers['Content-Type']= 'application/octet-stream';
			headers['Content-Range'] = 'bytes '+start+"-"+(totalSize-1)+"/"+totalSize;
		}
		if(start==0||!keepGoing) {
			req.writeHead(status,headers);
		}
		if(!keepGoing || end==totalSize-1) {
			req.end(contents);
		} else {
			req.write(contents);
			stream(path,end,end+chunkSize,req,keepGoing);
		}
	});
}

function getStartFromRange(rangeHeader) {
	if(rangeHeader) {
		var range=rangeHeader.split("=")[1];
		return Number(range.split("-")[0]);
	}
	return 0;
}

function getEndFromRange(rangeHeader, start) {
	if(rangeHeader) {
		var range=rangeHeader.split("=")[1];
		var parts = range.split("-");
		if(parts.length>1&&parts[1]!="") {
			return Number(parts[1]);
		}
	}
	return start+chunkSize;
}

MaestroApi.prototype = {
	handleRequest: function(req) {
		var url = req.headers.url;
		if (url == '/api/v1.0/server/ips') {
			return this.getIpAddresses(req);
		}
		if(url.indexOf("/videos")==0&&url.indexOf(".html")<0) {
			return this.serveVideo(req);
		}
		if(urlOnly(url) == '/api/v1.0/health') {
			return this.writeJsonResponse({"status":"Good"},req);
		}
		if(urlOnly(url) == '/api/v1.0/folders') {
			return this.listVideosAndFolders(req);
		}
	},
	writeJsonResponse: function(obj, req) {
		var result = JSON.stringify(obj);
		req.writeHead(200,{
			'Content-Type': 'application/json',
			'Content-Length': byteCount(result),
			"Access-Control-Allow-Origin":"*",
			"Access-Control-Allow-Methods":"POST, GET, OPTIONS, PUT, DELETE, HEAD",
			"Access-Control-Allow-Headers":"X-PINGOTHER, Origin, X-Requested-With, Content-Type, Accept, Accept-Encoding, Range",
			"Access-Control-Max-Age":"1728000"
		});
		req.end(result);
	},
	getIpAddresses : function(req) {
		var self = this;
		chrome.system.network.getNetworkInterfaces(function(interfaces){
			self.writeJsonResponse(interfaces.map(function(i) { return i.address; }), req);
		});
	},
	serveVideo: function(req) {
		var url = urlOnly(req.headers.url);
		var path = makeGoodPath(url.substring("/videos/".length));
		var self = this;
		var range = req.headers.Range;
		var start = getStartFromRange(range);
		var end = getEndFromRange(range, start);
		var keepStreaming = start==0;
		stream(path,start,end,req,keepStreaming)
	},
	listVideosAndFolders: function(req) {
		var url = req.headers.url;
		var queryString = getQueryStringParameters(url);
		var path = queryString["path"] || null;
		var self = this;
		if(path) {
			maestroFolders.getFiles(path,function(files) {
				self.writeJsonResponse(files,req);
			});
		} else {
			maestroFolders.getFolderNames(function(folders) {
				self.writeJsonResponse({files:[],folders:folders},req);
			});
		}
	}
}