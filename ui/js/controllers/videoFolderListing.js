var videoFolderListing = angular.module('videoFolderListing',[
    'videoFolderList'
]);

videoFolderListing.controller('VideoFolderListController', ['$scope', '$location','videoFolderList',
    function($scope, $location, videoFolderList) {
        var folder = $location.search().path;
        var promise = videoFolderList.getFiles(folder);
        promise.then(function(result) {
            $scope.folder = folder;
            $scope.folders = result.folders;
            $scope.files = result.files;
        });
    }
]);
