define(['jquery'],
        function($) {
            var ApiRequester = {};
            ApiRequester.ajaxRequest = function(request) {
                var requestInfo = {
                    url: request.url,
                    type: "GET",
                    success: function(data) {
                        if (typeof data == "string") {
                            try {
                                data = JSON.parse(data);
                            } catch (error) {

                            }
                        }
                       
                        request.success(data);
                        
                    }, error: function(data, t, e) {
                        if (typeof request.error == "function") {
                            request.error(data);
                        } else {
                            //alert("An error has occurred");
                        }
                    }
                };

                if (typeof request.data != "undefined") {
                    requestInfo.data = request.data;
                }
                if (typeof request.type != "undefined") {
                    requestInfo.type = request.type;
                }
                if (typeof request.processData != "undefined") {
                    requestInfo.processData = request.processData;
                }
                if (typeof request.contentType != "undefined") {
                    requestInfo.contentType = request.contentType;
                }            
                $.ajax(requestInfo);
            }


            ApiRequester.apiRequest = function(module, path, request, version) {
                var url = "/api/v1.0/" + module;
                if(path!="") {
                    url +="/"+path;
                }
                request.url = url;
                ApiRequester.ajaxRequest(request);
            }

            return ApiRequester;
        }
);

