var videoPlayer = angular.module('videoPlayer',[
    'playerManager',
    'chromecast'
]);

videoPlayer.controller('VideoPlayerController', ['$scope', '$location','videoFolderList','chromecast',
    function($scope, $location,videoFolderList,chromecast) {
        var index = $location.search().index;
        var folder = $location.search().folder;
        if(chromecast.isActivated()) {
            chromecast.playToChromeCast(folder,index);
            $scope.showVideo = false;
            $location.path("/remote.html")
        } else {
            $scope.showVideo = true;
            var promise = videoFolderList.getFiles(folder);
            promise.then(function(result) {

                $scope.index = index;
                $scope.folder = folder;
                $scope.sources = ["/videos"+folder+"/"+result.files[index]];

            });
        }
        
    }
]);

videoPlayer.directive('maestroPlayer', ['videoFolderList','$location','playerManager',
    function(videoFolderList,$location,playerManager,chromecast) {   
    return {
        restrict: "A",
        link: function (scope, element, attributes, parentController) {
            var video = element[0];
           
            playerManager.setPlayer(scope);
            
            scope.skipForward = function() {
              video.currentTime += 15;  
            };
            scope.skipBack = function() {
              video.currentTime -= 15;  
            };
            video.pause();
            scope.playNext = function() {
                var index = element.attr("data-index");
                index++;
                var folder = element.attr("data-folder");
                
                var promise = videoFolderList.getFiles(folder);
                promise.then(function(result) {
                    if(index>=result.files.length) {
                        var parentFolder = folder.substring(0,folder.lastIndexOf("/"));
                        promise = videoFolderList.getFiles(parentFolder);
                        promise.then(function(result) {
                            for(var i=0; i<result.folders.length; i++) {
                                var shortFolderName = folder.substring(parentFolder.length+1);
                                if(shortFolderName == result.folders[i]) {
                                    var nextFolder = parentFolder+"/"+result.folders[i+1];
                                    
                                    promise = videoFolderList.getFiles(nextFolder);
                                    promise.then(function(result) {
                                        scope.index = 0;
                                        scope.folder = nextFolder;
                                    
                                        scope.sources = ["/videos"+nextFolder+"/"+result.files[0]];
                                        element.attr("src",scope.sources[0]);
                                        video.load();
                                        $location.search({index:0,folder: nextFolder}).replace(); 
                                    });
                                    return;
                                }
                            }
                        });
                    } else {
                        promise = videoFolderList.getFiles(folder);
                        promise.then(function(result) {
                            scope.index = index;
                            scope.folder = folder;
                            scope.sources = ["/videos"+folder+"/"+result.files[index]];
                            element.attr("src",scope.sources[0]);
                            video.load();
                            $location.search({index:index,folder:folder}).replace();  
                        });
                    }
                });
            };
            scope.playPrevious = function() {
              var index = element.attr("data-index");
                index--;
                var folder = element.attr("data-folder");
                
                
                
                if(index<0) {
                    var parentFolder = folder.substring(0,folder.lastIndexOf("/"));
                    promise = videoFolderList.getFiles(parentFolder);
                    promise.then(function(result) {
                        for(var i=0; i<result.folders.length; i++) {
                            var shortFolderName = folder.substring(parentFolder.length+1);
                            if(shortFolderName == result.folders[i]) {
                                var previousFolder = parentFolder+"/"+result.folders[i-1];
                                promise = videoFolderList.getFiles(previousFolder);
                                promise.then(function(result) {
                                    var index = result.files.length-1;
                                    scope.index = index;
                                    scope.folder = previousFolder;
                                    scope.sources = ["/videos"+previousFolder+"/"+result.files[index]];
                                    element.attr("src",scope.sources[0]);
                                    video.load();
                                    $location.search({index:index,folder: previousFolder}).replace(); 
                                });
                                break;
                            }
                        }
                    });
                } else {
                    promise = videoFolderList.getFiles(folder);
                    promise.then(function(result) {
                        scope.index = index;
                        scope.folder = folder;
                        scope.sources = ["/videos"+folder+"/"+result.files[index]];
                        element.attr("src",scope.sources[0]);
                        video.load();
                        $location.search({index:index,folder:folder}).replace();   
                    });
                }
                
            };
            element.on("ended", function () {
                scope.playNext();
            });
            
            element.on('error', function() {
                window.currentTime = element.currentTime;
                element.on('loadeddata', function() {
                    if(window.currentTime !=null) {
                        element.currentTime = window.currentTime;
                        window.currentTime = null;
                    }
                },false)
            });
            
            element.on("play",function() {
                
                var video = element[0];
                var width = video.videoWidth;
                var height = video.videoHeight;

                var screenHeight = window.innerHeight;
                var screenWidth = window.innerWidth;
                if (!screenHeight) {
                    screenHeight = document.documentElement.clientHeight;
                    screenWidth = document.documentElement.clientWidth;
                }

                var widthAdjustment = 0;
                var heightAdjustment = 0;

                $(video).attr("height", null);
                $(video).attr("width", null);
                if (height / screenHeight > width / screenWidth) {
                    $(video).attr("height", screenHeight + heightAdjustment);
                } else {
                    $(video).attr("width", screenWidth + widthAdjustment);
                }
            });
        }
    }
}]);
