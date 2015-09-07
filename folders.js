MaestroFolders = function() {
}
var playlists = new Playlists();

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function tvShowSort(c1, c2) {
	for(var i=0; i<c1.length &&i<c2.length; i++) {
	    if(isNumeric(c1[i]) && isNumeric(c2[i])) {
	        var start = i;
	        var end1=start+1;
	        var end2 = start+1;
	        while(end1<c1.length && isNumeric(c1[end1])) end1++;
	        while(end2<c2.length && isNumeric(c2[end2])) end2++;
	        var n1 = Number(c1.substring(start, end1));
	        var n2 = Number(c2.substring(start, end2));
	        if(n1==n2) {
	            i=end1;
	        } else {
	            return n1-n2;
	        }
	    } else if(c1[i]!=c2[i]) {
	        return c1.localeCompare(c2);
	    }

	}
	return 0;
}

MaestroFolders.prototype = {
	addFolder: function(name, folderEntry) {
		this.getFolders(function(folders) {
			folders[name] = chrome.fileSystem.retainEntry(folderEntry);
			chrome.storage.local.set({'folders': folders}, function() {
			  // Notify that we saved.
			  console.log('Folder saved');
			});
		});
	},
	getFolders: function(callback) {
		chrome.storage.local.get('folders', function(items) {
			var folders = items['folders'] || {};
			callback(folders);
		});
	},
	getFolderNames: function(callback) {
		this.getFolders(function(folders) {
			var folderNames = [];
			for(var folderName in folders) {
				folderNames.push(folderName);
			}
			folderNames.push("Playlists");
			callback(folderNames);
		});
	},
	deleteFolder: function(name) {
		this.getFolders(function(folders) {
			delete folders[name];
			chrome.storage.local.set({'folders': folders}, function() {
			  // Notify that we saved the change.
			  console.log('Folder deleted');
			});
		});
	},
	getFolderEntry: function(folderName, callback) {
		this.getFolders(function(folders) {
			if(folders[folderName]) {
				chrome.fileSystem.restoreEntry(folders[folderName], callback);
			}

		});
	},
	getDirectoryReader: function(folderName, subdirectory, callback) {
		this.getFolderEntry(folderName, function(folderEntry) {
			if(!subdirectory || subdirectory=="") {
				callback(folderEntry.createReader());
			} else {
				folderEntry.getDirectory(subdirectory, {"create":false}, function(entry) {
					callback(entry.createReader());
				});
			}
		});
	},
	getFileEntry: function(folderName, filePath, callback) {
		this.getFolderEntry(folderName, function(folderEntry) {
			folderEntry.getFile(filePath, {"create":false}, function(entry) {
				callback(entry);
			});

		});
	},
	getPathForAliasPromise: function(path) {
		return new Promise(function(fulfill, reject) {
			if(path.indexOf("Playlists")==0) {
				var parts = path.split("/");
				var playlist = parts[1];
				var group = parts[2];
				var file = parts[3];
				playlists.getEpisodesPromise(playlist,group).then(function(episodes) {
					console.log(episodes);

					var episode= episodes.filter(function(episode) {
						var parts = path.split("/");
						var file = parts[3];
						return episode.name==file;
					})[0];
					fulfill(episode);
				});
			} else {
				fulfill(path);
			}
		});
	},
	getFileContents: function(basePath, start, end, callback) {
		var folders = this;
		this.getPathForAliasPromise(basePath).then(function(path) {
			if(typeof path=="object") {
				var folder = path.path;
				var fileName = path.name;
				path = folder+"/"+fileName;
			}
			var parts = path.split("/");
			var folderName = parts.splice(0,1)[0];
			var filePath = parts.join("/");

			folders.getFileEntry(folderName, filePath, function(entry) {
				entry.file(function(file) {
					var reader = new FileReader();
					reader.onloadend = function () {
						callback(reader.result, file.size);
					}
					if(end>=file.size) {
						end = file.size;
					}
					reader.readAsArrayBuffer(file.slice(start,end));
				});
			});
		});
	},
	getFiles: function(path, callback) {
		if(path.indexOf("/")==0) {
			path=path.substring(1);
		}
		var parts = path.split("/");
		var folderName = parts.splice(0,1);
		var subdirectory = parts.join("/");
		if(folderName=="Playlists") {
			if(parts.length>0) {
				var playlist = parts[0];
				if(parts.length>1) {
					var group = parts[1];
					playlists.getEpisodesPromise(playlist,group).then(function(episodes) {
						callback({"files":episodes.map(function(episode) { return episode.name;}),"folders":[]});
					});
				} else {
					playlists.getGroupsPromise(playlist).then(function(groups) {
						callback({"files":[],"folders":groups});
					});
				}
			} else {
				playlists.getPlaylistsPromise().then(function(playlists) {
					callback({"files":[],"folders":playlists});
				});
			}
		} else {
			this.getDirectoryReader(folderName,subdirectory,function(folderReader) {

				folderReader.readEntries(function(list) {
					var result = {"files":[],"folders":[]};
					for(var i=0; i<list.length; i++) {
						var item = list[i];
						if(item.isDirectory) {
							result.folders.push(item.name);
						} else {
							result.files.push(item.name);
						}
					}
					result.folders.sort(tvShowSort);
					result.files.sort(tvShowSort);
					callback(result);
				});
			});
		}
	}
}
