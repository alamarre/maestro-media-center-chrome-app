function $(id) {
	return document.getElementById(id);
}

function log(text) {
	console.log(text);
}

function MaestroServer() {
	return {
		uiLocation : "ui/angular/public_html",
		port: 8071,
		wsPort: 8072,
		updatePort : function (value) {
			this.port = value.port || this.port;
			$('browserLink').href = "http://localhost:" + this.port;
			$('port').value = this.port;
			this.server.listen(this.port);
			this.wsPort = this.port + 1;
			this.wsListener.listen(this.wsPort);
		},
		startServer : function () {
			// Listen for HTTP connections.
			this.server = new http.Server();
			this.wsListener = new http.Server();
			this.wsServer = new http.WebSocketServer(this.wsListener);
			var server = this.server;
			var wsServer = this.wsServer;
			var maestroServer = this;
			chrome.storage.local.get('port', function (port) {
				maestroServer.updatePort(port);
			});

			var maestroApi = new MaestroApi();

			server.addEventListener('request', function (req) {
				var url = req.headers.url;
				if (url == '/')
					url = '/index.html';
				// Serve the pages of this chrome application.
				if (url.indexOf("/api") == 0 || url.indexOf("/videos") == 0) {
					maestroApi.handleRequest(req);
					return true;
				}
				url = url.split("?")[0];
				if (url.indexOf(".html") > 0 && url.indexOf("/templates") != 0) {
					url = "/index.html";
				}
				req.serveUrl("/" + maestroServer.uiLocation + url);
				return true;
			});

			// A list of connected websockets.
			//var connectedSockets = [];
			var sessions = {};
			var hostnames = {};

			wsServer.addEventListener('request', function (req) {
				log('Client connected');
				var socket = req.accept();

				// Route the message to the right client
				socket.addEventListener('message', function (e) {

					var data = JSON.parse(e.data);
					var id = data.id;
					var hostname = data.host;
					var session = sessions[id] || socket;
					switch (data.action) {
					case "list":
						session.send(JSON.stringify(hostnames));
						break;
					case "setId":
						sessions[id] = socket;
						hostnames[hostname] = id;
						break;
					default:
						session.send(e.data);
						break;
					}
				});

				// When a socket is closed, remove it from the list of connected sockets.
				socket.addEventListener('close', function () {
					log('Client disconnected');
					for (var key in sessions) {
						if (sessions[key] == socket) {
							sessions.splice(i, 1);
							break;
						}
					}
				});
				return true;
			});

		}
	};
}

var maestroFolders = new MaestroFolders();

function addFolder(folderName, list) {

	var entry = document.createElement("div");
	var name = document.createElement("div");

	name.innerText = folderName;
	entry.appendChild(name);
	var deleteButton = document.createElement("button");
	deleteButton.innerText = "Delete";
	deleteButton.setAttribute("data-folder-name", folderName);
	deleteButton.addEventListener('click', function (e) {
		var parent = this.parentElement;
		parent.parentElement.removeChild(parent);
		maestroFolders.deleteFolder(this.getAttribute("data-folder-name"));
		console.log(this.getAttribute("data-folder-name"));
	});
	entry.appendChild(deleteButton);
	list.appendChild(entry);
}

function updateFolderList() {
	maestroFolders.getFolderNames(function (folderNames) {
		for (var i = 0; i < folderNames.length; i++) {
			var folderName = folderNames[i];
			if(folderName!="Playlists") {
				addFolder(folderName, folderList);
			}
		}
	});
}

var maestroServer = new MaestroServer();
var playlists = new Playlists();

document.addEventListener('DOMContentLoaded', function () {

	maestroServer.startServer();
	var folderList = $('folderList');
	$('folder').addEventListener('click', function (e) {
		chrome.fileSystem.chooseEntry({
			type : "openDirectory"
		}, function (folder) {
			console.log(folder);
			window.folderToAdd = folder;
			$('folderName').innertText = folder.name;
			if ($('name').value == "") {
				$('name').value = folder.name;
			}
		});
	});

	$('addFolder').addEventListener('click', function (e) {
		if (window.folderToAdd && $('name').value) {
			maestroFolders.addFolder($('name').value, window.folderToAdd);
			addFolder($('name').value, folderList);
			$('name').value = "";
			window.folderToAdd = null;
		}
	});

	$('updatePort').addEventListener('click', function (e) {
		var keys = {
			port : Number($('port').value)
		};
		chrome.storage.local.set(keys, function () {
			maestroServer.updatePort(keys);
		});
	});

	updateFolderList();
});
