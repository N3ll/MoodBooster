var DataQuery = require('./DataQuery');
var Request = require('../Request');
var _ = require('../common')._;

module.exports = (function () {
    var RequestOptionsBuilder = {};

    RequestOptionsBuilder._buildEndpointUrl = function (dataQuery) {
        var endpoint = dataQuery.collectionName;
        if (dataQuery.additionalOptions && dataQuery.additionalOptions.id) {
            endpoint += '/' + dataQuery.additionalOptions.id;
        }

        return endpoint;
    };

    RequestOptionsBuilder._buildBaseObject = function (dataQuery) {
        var defaultObject = {
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery),
            filter: dataQuery.filter,
            success: dataQuery.onSuccess,
            error: dataQuery.onError,
            data: dataQuery.data,
            headers: dataQuery.headers
        };

        if (dataQuery.parse) {
            defaultObject.parse = dataQuery.parse;
        }

        return defaultObject;
    };

    RequestOptionsBuilder._build = function (dataQuery, additionalOptions) {
        return _.extend(RequestOptionsBuilder._buildBaseObject(dataQuery), additionalOptions);
    };

    RequestOptionsBuilder[DataQuery.operations.read] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'GET'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.readById] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'GET'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.count] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'GET',
            endpoint: dataQuery.collectionName + '/_count'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.create] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.rawUpdate] = function (dataQuery) {
        var endpoint = dataQuery.collectionName;
        var filter = dataQuery.filter;
        var ofilter = null; // request options filter

        if (typeof filter === 'string') {
            endpoint += '/' + filter; // send the filter through query string
        } else if (typeof filter === 'object') {
            ofilter = filter; // send the filter as filter headers
        }

        return RequestOptionsBuilder._build(dataQuery, {
            method: 'PUT',
            endpoint: endpoint,
            filter: ofilter
        });
    };

    RequestOptionsBuilder[DataQuery.operations.update] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'PUT'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.remove] = function (dataQuery) {
        return _.extend(RequestOptionsBuilder._buildBaseObject(dataQuery), {
            method: 'DELETE'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.removeSingle] = RequestOptionsBuilder[DataQuery.operations.remove];

    RequestOptionsBuilder[DataQuery.operations.setAcl] = function (dataQuery) {
        var endpoint = dataQuery.collectionName;
        var filter = dataQuery.filter;

        if (typeof filter === 'string') { // if filter is string than will update a single item using the filter as an identifier
            endpoint += '/' + filter;
        } else if (typeof filter === 'object') { // else if it is an object than we will use it's id property
            endpoint += '/' + filter[idField];
        }
        endpoint += '/_acl';
        var method, data;
        if (dataQuery.additionalOptions.acl === null) {
            method = 'DELETE';
        } else {
            method = 'PUT';
            data = dataQuery.additionalOptions.acl;
        }

        return RequestOptionsBuilder._build(dataQuery, {
            method: method,
            endpoint: endpoint,
            data: data
        });
    };

    RequestOptionsBuilder[DataQuery.operations.setOwner] = function (dataQuery) {
        var endpoint = dataQuery.collectionName;
        var filter = dataQuery.filter;
        if (typeof filter === 'string') { // if filter is string than will update a single item using the filter as an identifier
            endpoint += '/' + filter;
        } else if (typeof filter === 'object') { // else if it is an object than we will use it's id property
            endpoint += '/' + filter[idField];
        }
        endpoint += '/_owner';

        return RequestOptionsBuilder._build(dataQuery, {
            method: 'PUT',
            endpoint: endpoint
        });
    };

    RequestOptionsBuilder[DataQuery.operations.userLogin] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: 'oauth/token',
            authHeaders: false,
            parse: Request.parsers.single
        });
    };

    RequestOptionsBuilder[DataQuery.operations.userLogout] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'GET',
            endpoint: 'oauth/logout'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.userChangePassword] = function (dataQuery) {
        var keepTokens = dataQuery.additionalOptions.keepTokens;
        var endpoint = 'Users/changepassword';
        if (keepTokens) {
            endpoint += '?keepTokens=true';
        }

        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: endpoint,
            authHeaders: false,
            parse: Request.parsers.single
        });
    };

    RequestOptionsBuilder[DataQuery.operations.userLoginWithProvider] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            authHeaders: false
        });
    };

    RequestOptionsBuilder[DataQuery.operations.userLinkWithProvider] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery) + '/link'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.userUnlinkFromProvider] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery) + '/unlink'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.userResetPassword] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery) + '/resetpassword'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.userSetPassword] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery) + '/setpassword'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.filesUpdateContent] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'PUT',
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery) + '/Content'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.filesGetDownloadUrlById] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'GET'
        });
    };

    return RequestOptionsBuilder;
}());