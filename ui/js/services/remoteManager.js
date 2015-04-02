var remoteManager = angular.module('remoteManager', [
    'cookies'
]);

remoteManager.factory('remoteManager', ['$q', 'cookies',function($q, cookies) {
    var socket;
    var selfId = guid();
    var available;
    var remoteId = null;
    var availableDeferrals = [];
    return {
        connect: function() {
            var possibleRemoteId = cookies.getCookie("remoteId");
            if(possibleRemoteId!="") {
                remoteId = possibleRemoteId;
            }
            var port = parseInt(window.location.port)+1
            socket= new WebSocket("ws://"+window.location.hostname+":"+port+"/events"); 
            var remote = this;
            socket.onmessage = this.handleMessage;
            socket.onopen = function() {
                remote.onOpen();
            };
            socket.onerror = function(error) {
                console.log(error);
            };
            socket.onclose = function(close) {
                console.log(close);
                remote.connect();
            };
        },
        sendMessage: function(message) {
            if(!message.id && message.action!="list") {
                message.id = remoteId;
            }
            socket.send(JSON.stringify(message));
        },
        onOpen: function() {
            this.sendMessage({"action":"list"});
        },
        handleMessage: function(event) {
            if(event.data) {
                var message = JSON.parse(event.data);
                if(message.action=="setId") {
                    this.sendMessage({"id":selfId,"action":"list"});
                } else if(!message.action) {
                    available = message;
                    for(var i=0; i<availableDeferrals.length; i++) {
                        availableDeferrals[i].resolve(available);
                    }
                }
            }
        },
        setRemoteId: function(id, permanent) {
            remoteId=id;
            if(permanent) {
                cookies.setCookie("remoteId",id,1000);
            }
        },
        isRemoteSet: function() {
            return remoteId != null;
        },
        getHosts: function() {
            var deferred = $q.defer();
            var promise = deferred.promise;
            if(available) {
                deferred.resolve(available);
            } else {
                availableDeferrals.push(deferred);
            }
            
            return promise;
        },
        skipBack: function() {
            this.sendMessage({"action":"skipBack"});
        },
        skipForward: function() {
            this.sendMessage({"action":"skipForward"});
        },
        playNext: function() {
            this.sendMessage({"action":"playNext"});
        },
        playPrevious: function() {
            this.sendMessage({"action":"playPrevious"});
        },
        play: function() {
            this.sendMessage({"action":"play"});
        },
        pause: function() {
            this.sendMessage({"action":"pause"});
        },
        seek: function(timePercent) {
            this.sendMessage({"action":"seek","percent":timePercent});
        },
        toggleVisibility: function() {
            this.sendMessage({"action":"toggleVisibility"});
        },
     }
}]);

