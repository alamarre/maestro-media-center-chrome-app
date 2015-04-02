define([],
    function () {
        
        directiveMaker.directive('video-menu', function() {
            
        });
        
        controllerMaker.register("VideoMenu",['$scope','$sce','$route','$element','$compile',
            function($scope,$sce,$route,$element,$compile) {
                
        }]);
        
        return function() {
            return "<video-menu ng-controller=\"VideoMenu\"></video-menu>";
        };
    }
);

