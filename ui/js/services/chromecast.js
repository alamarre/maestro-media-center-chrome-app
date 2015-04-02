var chromecast = angular.module('chromecast', [
    'remoteManager'
]);

chromecast.factory('chromecast', ['$http', 'remoteManager',function($http,remoteManager) {
    var session = null;
    var serverUrls = null;
    var launchImmediate = false;

    var chromecastApplicationId = "7B866935";
    return {
        isActivated: function() {
            return (session!=null && session!=false);
        },
        initialize: function() {
            if(typeof chrome=="undefined") {
                return;
            }
            this.fetchServerUrls();
            if (!chrome.cast || !chrome.cast.isAvailable) {
                setTimeout(this.initialize.bind(this), 1000);
                return;
            }
            var sessionRequest = new chrome.cast.SessionRequest(chromecastApplicationId);
            var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
                    this.sessionListener.bind(this),
                    this.receiverListener.bind(this));
            chrome.cast.initialize(apiConfig, this.onCastInitSuccess.bind(this), this.onCastInitError.bind(this));
        },
        getServerUrls: function() {
            return serverUrls;
        },
        fetchServerUrls: function() {
            $http({
                method: 'GET',
                url: '/api/v1.0/server/ips',
            })
            .success(function(result) {
                serverUrls = result;
            });
        },
        launch: function() {
            chrome.cast.requestSession(this.onRequestSessionSuccess.bind(this), this.onLaunchError.bind(this));
        },
        onRequestSessionSuccess: function(e){
            console.log("session success");
            session = e;
            if (session) {
                session.addUpdateListener(this.sessionUpdateListener.bind(this));
            }
        },
        onLaunchError: function(error){
            console.log(error);
            console.log("chromecast launch failed");
        },
        sessionListener: function(e) {
            console.log("session" +e);
            session = e;
            if (session) {
                session.addUpdateListener(this.sessionUpdateListener.bind(this));
            }
        },
        sessionUpdateListener: function(isAlive) {
            console.log("session " + isAlive);
            if(!isAlive) {
                session = false;
            } 
        },
        receiverListener: function(e) {
            if (e === 'available') {
                console.log("receiver found");
            }
            else {
                console.log("receiver list empty");
            }
        },
        onCastInitSuccess: function(){
            if(launchImmediate) {
                this.launch();
            }
        },
        onCastRequestSessionSuccess: function() {
            console.log("launched chromecast session");
        },
        onCastLaunchError: function() {
            console.log("failed to launch chromecast");
        },
        onCastInitError: function() {
            console.log("failed to cast");
        },
        playToChromeCast: function(folder, index) {
            var id = "Chromecast - "+session.receiver.friendlyName;
            remoteManager.setRemoteId(id);
            var playMessage = {
                "action": "play",
                "folder": folder,
                "index": index,
                "port": window.location.port,
                "scheme":window.location.protocol,
                "guid": id,
                "deviceName": id
            };
            
            playMessage.serverUrls = serverUrls;
            var either = function(){};
            if(session) {
                session.sendMessage('urn:x-cast:maestro', playMessage, either, either);
            }
        }

    };
}]);