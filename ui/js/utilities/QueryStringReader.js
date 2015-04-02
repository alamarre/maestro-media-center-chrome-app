define([],
    function() {
        function QueryStringReader() {            
            this.parseParameters = function(queryString) {
                var params = queryString.split('&');
                var results = {};
                for (var i = 0; i < params.length; i++)
                {
                    var param = params[i].split('=');
                    results[param[0]] =  decodeURIComponent(param[1]);
                }
                return results;
            };
            
            this.getParameterFromUrl = function(url,name) {
                var queryString = url.substring(url.indexOf("?")+1);
                var parameters = this.parseParameters(queryString);
                return parameters[name];
            }
        }
        return new QueryStringReader();
    }
);


