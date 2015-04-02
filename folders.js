MaestroFolders = function() {
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
	getFileContents: function(path, start, end, callback) {	
		var parts = path.split("/");
		var folderName = parts.splice(0,1)[0];
		var filePath = parts.join("/");
		this.getFileEntry(folderName, filePath, function(entry) {
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
	},
	getFiles: function(path, callback) {
		if(path.indexOf("/")==0) {
			path=path.substring(1);
		}
		var parts = path.split("/");
		var folderName = parts.splice(0,1);
		var subdirectory = parts.join("/");
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
				callback(result);
			});
		});
	}
}