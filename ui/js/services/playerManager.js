var playerManager = angular.module('playerManager', []);

playerManager.factory('playerManager', [function() {
    var _player;
    return {
        setPlayer: function(player) {
            _player = player;
        },
        getPlayer: function() {
            return _player;
        }
    };
}]);