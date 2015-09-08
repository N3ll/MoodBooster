var _ = require('../common')._;
var constants = require('../constants');
var Query = require('../query/Query');
var Headers = constants.Headers;

module.exports = (function () {
    // TODO: [offline] Update the structure - filter field can be refactored for example and a skip/limit/sort property can be added
    var DataQuery = function (config) {
        this.collectionName = config.collectionName;
        this.headers = config.headers || {};
        this.filter = config.filter;
        this.onSuccess = config.onSuccess;
        this.onError = config.onError;
        this.operation = config.operation;
        this.parse = config.parse;
        this.additionalOptions = config.additionalOptions;
        this.data = config.data;
        this.useOffline = config.useOffline;
        this.applyOffline = config.applyOffline;
        this.noRetry = config.noRetry; //retry will be done by default, when a request fails because of expired token, once the authentication.completeAuthentication in sdk is called.
        this.skipAuth = config.skipAuth; //if set to true, the sdk will not require authorization if the data query fails because of expired token. Used internally for various login methods.
        this._normalizedHeaders = null;
        this.isSync = config.isSync;
    };

    DataQuery.prototype = {
        _normalizeHeaders: function () {
            var self = this;
            var headerKeys = Object.keys(this.headers);

            this._normalizedHeaders = {};
            _.each(headerKeys, function (headerKey) {
                var normalizedKey = headerKey.toLowerCase();
                self._normalizedHeaders[normalizedKey] = self.headers[headerKey];
            });
        },

        getHeader: function (header) {
            if (!this._normalizedHeaders) {
                this._normalizeHeaders();
            }

            var normalizedHeader = header.toLowerCase();
            return this._normalizedHeaders[normalizedHeader];
        },

        getHeaderAsJSON: function (header) {
            if (!this._normalizedHeaders) {
                this._normalizeHeaders();
            }

            var headerValue = this._normalizedHeaders[header.toLowerCase()];
            if (_.isObject(headerValue)) {
                return headerValue;
            }
            if (_.isString(headerValue)) {
                try {
                    return JSON.parse(headerValue);
                } catch (e) {
                    return headerValue;
                }
            } else {
                return headerValue;
            }
        },

        getQueryParameters: function () {
            var queryParams = {};

            if (this.operation === DataQuery.operations.readById) {
                queryParams.filter = this.additionalOptions.id;
                queryParams.expand = this.getHeaderAsJSON(Headers.expand);
            } else {
                var sort = this.getHeaderAsJSON(Headers.sort);
                var limit = this.getHeaderAsJSON(Headers.take);
                var skip = this.getHeaderAsJSON(Headers.skip);
                var select = this.getHeaderAsJSON(Headers.select);
                var filter = this.getHeaderAsJSON(Headers.filter);
                var expand = this.getHeaderAsJSON(Headers.expand);

                if (this.filter instanceof Query) {
                    var filterObj = this.filter.build();
                    queryParams.filter = filterObj.$where || filter || {};
                    queryParams.sort = filterObj.$sort || sort;
                    queryParams.limit = filterObj.$take || limit;
                    queryParams.skip = filterObj.$skip || skip;
                    queryParams.select = filterObj.$select || select;
                    queryParams.expand = filterObj.$expand || expand;
                } else {
                    queryParams.filter = (this.filter || filter) || {};
                    queryParams.sort = sort;
                    queryParams.limit = limit;
                    queryParams.skip = skip;
                    queryParams.select = select;
                    queryParams.expand = expand;
                }
            }

            return queryParams;
        }
    };

    DataQuery.operations = {
        read: 'read',
        create: 'create',
        update: 'update',
        remove: 'destroy',
        removeSingle: 'destroySingle',
        readById: 'readById',
        count: 'count',
        rawUpdate: 'rawUpdate',
        setAcl: 'setAcl',
        setOwner: 'setOwner',
        userLogin: 'login',
        userLogout: 'logout',
        userChangePassword: 'changePassword',
        userLoginWithProvider: 'loginWith',
        userLinkWithProvider: 'linkWith',
        userUnlinkFromProvider: 'unlinkFrom',
        userResetPassword: 'resetPassword',
        userSetPassword: 'setPassword',
        filesUpdateContent: 'updateContent',
        filesGetDownloadUrlById: 'downloadUrlById'
    };

    return DataQuery;
}());