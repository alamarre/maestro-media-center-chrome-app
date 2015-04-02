var remoteControl = angular.module('remoteControl',[
    'remoteManager'
]);

remoteControl.controller('RemoteController', ['$scope','remoteManager',
  function ($scope, remoteManager) {
    $scope.remote = remoteManager; 
    $scope.time = 20;
  }]);
  
  remoteControl.directive('slider', ['remoteManager',
    function(remoteManager) {   
    return {
        restrict: "A",
        link: function (scope, element, attributes, parentController) {
            $(element).slider({
                change: function( event, ui ) {
                    remoteManager.seek(ui.value);
                }
            });
        }
    }
    }]);

