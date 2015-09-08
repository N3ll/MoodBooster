var http = require('http');
module.exports = (function () {
    'use strict';

    function reqwest(options) {
        var httpRequestOptions = {
            url: options.url,
            method: options.method,
            headers: options.headers || {}
        };

        if (options.data) {
            httpRequestOptions.content = options.data; // NOTE: If we pass null/undefined, it will raise an exception in the http module.
        }

        httpRequestOptions.headers['Accept'] = 'application/json';
        httpRequestOptions.headers['Content-Type'] = 'application/json';

        var noop = function () {
        };
        var success = options.success || noop;
        var error = options.error || noop;

        var requestSuccessCallback = function (response) {
            var contentString = response.content.toString();
            if (response.statusCode < 400) {
                // Success callback calls a custom parse function
                success(contentString);
            } else {
                // Error callback relies on a JSON Object with ResponseText inside
                error({
                    responseText: contentString
                });
            }
        };

        var requestErrorCallback = function (err) {
            // error: function(jqXHR, textStatus, errorThrown)
            // when timeouting for example (i.e. no internet connectivity), we get an err with content { message: "timeout...", stack: null }
            error({
                responseText: err
            });
        };

        http.request(httpRequestOptions).then(requestSuccessCallback, requestErrorCallback);
    }

    return reqwest;
}());