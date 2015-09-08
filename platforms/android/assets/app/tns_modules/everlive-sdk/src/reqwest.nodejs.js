var url = require('url');
var http = require('http');
var https = require('https');
var rsvp = require('rsvp');
var zlib = require('zlib');
var _ = require('underscore');

module.exports = (function () {
    'use strict';

    function reqwest(options) {
        var urlParts = url.parse(options.url);
        var request;
        if (urlParts.protocol === 'https:') {
            request = https.request;
        }
        else {
            request = http.request;
        }
        var headers = options.headers || {};
        options.success = options.success || _.noop;
        options.error = options.error || _.noop;

        headers['Content-Type'] = options.contentType;
        var req = request({
            method: options.method,
            hostname: urlParts.hostname,
            port: urlParts.port,
            path: urlParts.path,
            headers: headers
        }, function (res) {
            var json = '';
            var contentEncoding = res.headers['content-encoding'];
            var responseProxy;
            switch (contentEncoding){
                case 'gzip':
                    responseProxy = zlib.createGunzip();
                    res.pipe(responseProxy);
                    break;
                default:
                    responseProxy = res;
                    responseProxy.setEncoding('utf8');
                    break;
            }

            responseProxy.on('data', function (data) {
                json += data.toString();
            });

            responseProxy.on('end', function () {
                // 1xx Informational, 2xx Success, 3xx Redirection, 4xx Client Error, 5xx Server Error
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    options.success(json, res);
                } else {
                    if (json) {
                        options.error({ responseText: json });
                    }
                    else { // empty response
                        var error = new Error('Response error.');
                        error.statusCode = res.statusCode;
                        options.error({ responseText: error });
                    }
                }
            });
        });

        req.on('error', function (e) {
            options.error({ responseText: e }); // TODO
        });

        if (options.data) {
            var contentEncoding = headers['content-encoding'];
            switch (contentEncoding){
                case 'gzip':
                    var buf = new Buffer(options.data, 'utf-8');
                    zlib.gzip(buf, function (err, result) {
                        req.end(result);
                    });
                    break;
                default:
                    req.end(options.data);
                    break;
            }
        }
        else {
            req.end();
        }
    }

    return reqwest;
}());