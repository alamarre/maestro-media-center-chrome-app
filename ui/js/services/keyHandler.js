var keyHandler = angular.module('keyHandler', [
    'playerManager'
]);

keyHandler.factory('keyHandler', ['Page','playerManager','remoteManager',function(Page,playerManager,remoteManager) {
return {
  handleKeypress: function($event) {
    console.log($event);
    if($event.keyCode==116) {
        Page.setHidden(!Page.isHidden());
    }
    var player = playerManager.getPlayer();
    if(remoteManager.isRemoteSet()) {
        switch($event.keyCode) {
            case 52:
                remoteManager.skipBack();
                break;
            case 54:
                remoteManager.skipForward();
                break;
            case 78:
            case 51:
            case 110:
                remoteManager.playNext();
                break;
            case 80:
            case 49:
            case 112:
                remoteManager.playPrevious();
                break;
            case 85:
                remoteManager.pause();
                break;
        }
    } else if(player) {
        switch($event.keyCode) {
            case 52:
                player.skipBack()
                break;
            case 54:
                player.skipForward()
                break;
            case 78:
            case 51:
            case 110:
                player.playNext();
                break;
            case 80:
            case 49:
            case 112:
                player.playPrevious();
                break;
            case 85:
                player.pause();
                break;
            
        
        }
        
    }
  }
};
}]);