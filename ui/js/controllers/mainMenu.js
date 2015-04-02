var mainMenu = angular.module('mainMenu',[
    'videoMenu',
    'remoteManager'
]);

mainMenu.controller('MainMenuController', ['$scope', 'remoteManager',
  function ($scope, remoteManager) {
    $scope.remote = remoteManager.isRemoteSet();
  }]);

