var utils = require('./utils');
var rsvp = require('./common').rsvp;
var buildAuthHeader = utils.buildAuthHeader;
var parseUtilities = utils.parseUtilities;
var guardUnset = utils.guardUnset;
var common = require('./common');
var reqwest = common.reqwest;
var _ = common._;
var Headers = require('./constants').Headers;
var isNodejs = require('./everlive.platform').isNodejs;
var Query = require('./query/Query');

module.exports = (function () {
    var _self;

    // The Request type is an abstraction over Ajax libraries
    // A Request object needs information about the Everlive connection and initialization options

    function Request(setup, options) {
        guardUnset(setup, 'setup');
        guardUnset(options, 'options');
        this.setup = setup;
        this.method = null;
        this.endpoint = null;
        this.data = null;
        this.headers = {};
        // TODO success and error callbacks should be uniformed for all ajax libs
        this.success = null;
        this.error = null;
        this.parse = Request.parsers.simple;

        _.extend(this, options);
        _self = this;
        this._init(options);
    }

    Request.prototype = {
        // Calls the underlying Ajax library
        send: function () {
            Request.sendRequest(this);
        },
        // Returns an authorization header used by the request.
        // If there is a logged in user for the Everlive instance then her/his authentication will be used.
        buildAuthHeader: buildAuthHeader,
        // Builds the URL of the target Everlive service
        buildUrl: function buildUrl(setup) {
            return utils.buildUrl(setup);
        },
        // Processes the given query to return appropriate headers to be used by the request
        buildQueryHeaders: function buildQueryHeaders(query) {
            if (query) {
                if (query instanceof Query) {
                    return Request.prototype._buildQueryHeaders(query);
                }
                else {
                    return Request.prototype._buildFilterHeader(query);
                }
            }
            else {
                return {};
            }
        },
        // Initialize the Request object by using the passed options
        _init: function (options) {
            _.extend(this.headers, this.buildAuthHeader(this.setup, options), this.buildQueryHeaders(options.filter), options.headers);
        },
        // Translates an Everlive.Query to request headers
        _buildQueryHeaders: function (query) {
            query = query.build();
            var headers = {};
            if (query.$where !== null) {
                headers[Headers.filter] = JSON.stringify(query.$where);
            }
            if (query.$select !== null) {
                headers[Headers.select] = JSON.stringify(query.$select);
            }
            if (query.$sort !== null) {
                headers[Headers.sort] = JSON.stringify(query.$sort);
            }
            if (query.$skip !== null) {
                headers[Headers.skip] = query.$skip;
            }
            if (query.$take !== null) {
                headers[Headers.take] = query.$take;
            }
            if (query.$expand !== null) {
                headers[Headers.expand] = JSON.stringify(query.$expand);
            }
            return headers;
        },
        // Creates a header from a simple filter
        _buildFilterHeader: function (filter) {
            var headers = {};
            headers[Headers.filter] = JSON.stringify(filter);
            return headers;
        }
    };

    var parseOnlyCompleteDateTimeString = _self && _self.setup && _self.setup.parseOnlyCompleteDateTimeObjects;

    var reviver = parseUtilities.getReviver(parseOnlyCompleteDateTimeString);

    Request.parsers = {
        simple: {
            result: parseUtilities.parseResult.bind(null, reviver),
            error: parseUtilities.parseError.bind(null, reviver)
        },
        single: {
            result: parseUtilities.parseSingleResult.bind(null, reviver),
            error: parseUtilities.parseError.bind(null, reviver)
        },
        update: {
            result: parseUtilities.parseUpdateResult.bind(null, reviver),
            error: parseUtilities.parseError.bind(null, reviver)
        }
    };

    // TODO built for request
    if (typeof Request.sendRequest === 'undefined') {
        Request.sendRequest = function (request) {
            var url = request.buildUrl(request.setup) + request.endpoint;
            url = utils.disableRequestCache(url, request.method);
            request.method = request.method || 'GET';
            var data = request.method === 'GET' ? request.data : JSON.stringify(request.data);

            var requestParams = {
                url: url,
                method: request.method,
                data: data,
                headers: request.headers,
                contentType: 'application/json'
            };

            if (isNodejs) {
                requestParams.success = function (data, response) {
                    request.success.call(request, request.parse.result(data), response);
                };

                requestParams.error = function (jqXHR) {
                    request.error.call(request, request.parse.error(jqXHR.responseText || jqXHR.statusText));
                };
            } else {
                requestParams.type = 'json';
                requestParams.crossOrigin = true;
                requestParams.success = function (data, textStatus, jqXHR) {
                    var result = request.parse.result(data);
                    request.success.call(request, result);
                };

                requestParams.error = function (jqXHR, textStatus, errorThrown) {
                    var error = request.parse.error(jqXHR.responseText || jqXHR.statusText);
                    request.error.call(request, error);
                };
            }

            reqwest(requestParams);
        };
    }

    return Request;
}());