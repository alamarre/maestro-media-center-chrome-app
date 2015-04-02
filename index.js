function $(id) {
  return document.getElementById(id);
}

function log(text) {
  $('log').value += text + '\n';
}

var port = 8717;
var wsPort = port+1;
var isServer = false;
if (http.Server && http.WebSocketServer) {
  // Listen for HTTP connections.
  var server = new http.Server();
  var wsListener = new http.Server();
  var wsServer = new http.WebSocketServer(wsListener);
  server.listen(port);
  wsListener.listen(wsPort);
  isServer = true;
  var maestroApi = new MaestroApi();

  server.addEventListener('request', function(req) {
    var url = req.headers.url;
    if (url == '/')
      url = '/index.html';
    // Serve the pages of this chrome application.
	if(url.indexOf("/api")==0 || url.indexOf("/videos")==0) {
		maestroApi.handleRequest(req);
		return true;
	}
	url = url.split("?")[0];
	if(url.indexOf(".html")>0&&url.indexOf("/templates")!=0) {
		url = "/index.html";
	}
    req.serveUrl("/ui"+url);
    return true;
  });

  // A list of connected websockets.
  var connectedSockets = [];

  wsServer.addEventListener('request', function(req) {
    log('Client connected');
    var socket = req.accept();
    connectedSockets.push(socket);

    // When a message is received on one socket, rebroadcast it on all
    // connected sockets.
    socket.addEventListener('message', function(e) {
      for (var i = 0; i < connectedSockets.length; i++)
        connectedSockets[i].send(e.data);
    });

    // When a socket is closed, remove it from the list of connected sockets.
    socket.addEventListener('close', function() {
      log('Client disconnected');
      for (var i = 0; i < connectedSockets.length; i++) {
        if (connectedSockets[i] == socket) {
          connectedSockets.splice(i, 1);
          break;
        }
      }
    });
    return true;
  });
}

var maestroFolders = new MaestroFolders();

document.addEventListener('DOMContentLoaded', function() {
  $('folder').addEventListener('click', function(e) {
    chrome.fileSystem.chooseEntry({type:"openDirectory"}, function(folder) {
		console.log(folder);
		window.folderToAdd = folder;
		$('folderName').innertText=folder.name;
	});
  });
  
  $('addFolder').addEventListener('click', function(e) {
		maestroFolders.addFolder($('name').value,window.folderToAdd);
  });
});
