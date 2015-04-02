if(typeof console == "undefined") {
    console = {log:function(){}};
}

function versioned(url) {
    if(!url.indexOf("/")==0) {
        url = "/"+url;
    }
    return "/version/"+version+url;
}

var maestroApp = angular.module('maestroApp', [
  'ngRoute',
  'mainMenu',
  'keyHandler',
  'videoPlayer',
  'settings',
  'remoteManager',
  'remoteControl'
]);

maestroApp.config(['$routeProvider', '$locationProvider', '$compileProvider', '$controllerProvider',
  function($routeProvider, $locationProvider, $compileProvider, $controllerProvider) {
    window.directiveMaker = $compileProvider;
    window.controllerMaker = $controllerProvider;
    window.routeProvider = $routeProvider;
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix = '!';
    $routeProvider.
      when('/', {
        templateUrl: 'templates/mainMenu.html',
        controller: 'MainMenuController'
      }).
      when('/videos.html', {
        templateUrl: 'templates/videoMenu.html',
        controller: 'VideoMenuController'
      }).
      when('/videos/folders.html', {
        templateUrl: 'templates/videoFolderList.html',
        controller: 'VideoFolderListController'
      }).
      when('/player.html', {
        templateUrl: 'templates/videoPlayer.html',
        controller: 'VideoPlayerController',
        reloadOnSearch: false
      }).
      when('/settings.html', {
        templateUrl: 'templates/settings.html',
        controller: 'SettingsController'
      }).
      when('/remote.html', {
        templateUrl: 'templates/remoteControl.html',
        controller: 'RemoteController'
      })
  }]);
  
maestroApp.factory('Page', function() {
   var title = ' ';
   var hide = false;
   return {
     title: function() { return title; },
     setTitle: function(newTitle) { title = newTitle },
     isHidden: function() { return hide; },
     setHidden: function(hidden) { hide = hidden }
   };
});

maestroApp.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
});

requirejs.config({
    baseUrl: '/js',
    urlArgs: "v="+version,
    waitSeconds: 20,
    paths: {
        jquery: 'lib/jquery'
    }
});

maestroApp.controller('MainCtrl',['$scope', 'Page', 'keyHandler','chromecast','remoteManager',
  function($scope, Page, keyHandler,chromecast,remoteManager) {
    $scope.Page = Page;
    $scope.handleKeypress = keyHandler.handleKeypress;
    chromecast.initialize();
    remoteManager.connect();
  }])


