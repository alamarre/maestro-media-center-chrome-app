function Playlists() {
}

function loadPlaylistsPromise() {
	return new Promise(function(fulfill,reject) {
		chrome.storage.local.get("playlists", function(playlists) {
			fulfill(playlists.playlists);
		});
	});
}

function savePlaylistsPromise(playlists) {
	return new Promise(function(fulfill,reject) {
		chrome.storage.local.set({"playlists":playlists}, function() {
			fulfill();
		});
	});
}

Playlists.prototype = {
	servePlaylistsAsFolders: true,
	getPlaylistsPromise: function() {
		return new Promise(function(fulfill,reject) {
			loadPlaylistsPromise().then(function(playlists) {
				fulfill(Object.keys(playlists));
			},reject);
		});
	},
	getGroupsPromise: function(playlist) {
		return new Promise(function(fulfill,reject) {
			loadPlaylistsPromise().then(function(playlists) {
				if(typeof playlists[playlist]=="undefined") {
					reject();
				}
				fulfill(Object.keys(playlists[playlist].groups));
			},reject);
		});
	},
	getEpisodesPromise: function(playlist,group) {
		return new Promise(function(fulfill,reject) {
			loadPlaylistsPromise().then(function(playlists) {
				if(typeof playlists[playlist]=="undefined" || typeof playlists[playlist]["groups"][group]=="undefined") {
					reject();
				}
				fulfill(playlists[playlist]["groups"][group]);
			},reject);
		});
	},
	addPlaylist: function(playlist) {
		loadPlaylistsPromise().then(function(playlists) {
			playlists[playlist.name]=playlist;
			savePlaylistsPromise(playlists);
		});
	}
}