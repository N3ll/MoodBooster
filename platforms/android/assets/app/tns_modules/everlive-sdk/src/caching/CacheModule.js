'use strict';

var constants = require('../constants');
var common = require('../common');
var utils = require('../utils');
var buildPromise = utils.buildPromise;
var jsonStringify = common.jsonStringify;
var rsvp = common.rsvp;
var _ = require('underscore');

var persisters = require('../offline/offlinePersisters');
var EverliveError = require('../EverliveError').EverliveError;
var Query = require('../query/Query');
var DataQuery = require('../query/DataQuery');
var buildOfflineStorageOptions = require('../offline/offline').buildOfflineStorageOptions;

var CacheModule = function (options, everlive) {
    this.options = options;
    this.typeSettings = this.options.typeSettings;
    this.maxAgeInMs = this.options.maxAge * 60 * 1000;
    this._everlive = everlive;
};

var cacheableOperations = [
    DataQuery.operations.read,
    DataQuery.operations.readById,
    DataQuery.operations.count
];

CacheModule.prototype = {
    _hash: function (obj) {
        return jsonStringify(obj);
    },

    // using the offline storage options to initialize the same type of storage
    _initStore: function (sdkOptions) {
        if (!this.persister) {
            var offlineStorageOptions = buildOfflineStorageOptions(sdkOptions);
            var storageKey = this.options.storage.storagePath;

            this.persister = persisters.getPersister(storageKey, offlineStorageOptions);
        }
    },

    _getCacheData: function () {
        var self = this;

        if (!this.cacheData) {
            return this._persisterGetAllDataWrap()
                .then(function (cacheData) {
                    self.cacheData = cacheData;
                    return self.cacheData;
                });
        }

        return utils.successfulPromise(this.cacheData);
    },

    _persisterGetAllDataWrap: function () {
        var self = this;

        return new rsvp.Promise(function (resolve, reject) {
            return self.persister.getAllData(resolve, reject);
        });
    },

    _persisterSaveDataWrap: function (contentType, data) {
        var self = this;
        return new rsvp.Promise(function (resolve, reject) {
            return self.persister.saveData(contentType, JSON.stringify(data), resolve, reject);
        });
    },

    _getCacheDataForContentType: function (contentType) {
        return this._getCacheData()
            .then(function (cacheData) {
                if (typeof cacheData[contentType] === 'string') {
                    cacheData[contentType] = JSON.parse(cacheData[contentType]);
                } else {
                    cacheData[contentType] = cacheData[contentType] || {};
                }

                return _.clone(cacheData[contentType]);
            })
    },

    _persistCacheData: function (contentType, cacheData) {
        var self = this;

        return this._getCacheDataForContentType(contentType)
            .then(function () {
                var dataToCache = _.extend({}, self.cacheData[contentType], cacheData);
                self.cacheData[contentType] = _.compactObject(dataToCache);
                return self._persisterSaveDataWrap(contentType, self.cacheData[contentType]);
            });
    },

    isQueryUnsupportedOffline: function (dataQuery) {
        var hasPowerfieldsExpression = !!dataQuery.getHeader(constants.Headers.powerFields);
        var queryParams = dataQuery.getQueryParameters();
        var dataQueryFilter = queryParams.filter;
        var unsupportedDbOperators = utils.getUnsupportedOperators(dataQueryFilter);
        var hasUnsupportedOperators = unsupportedDbOperators.length !== 0;
        return hasPowerfieldsExpression || hasUnsupportedOperators;
    },

    _shouldSkipCache: function (dataQuery) {
        var operationShouldSkipCache = cacheableOperations.indexOf(dataQuery.operation) === -1;
        var collectionName = dataQuery.collectionName;
        var typeSettings = this.typeSettings;
        var cacheDisabledForContentType = typeSettings && typeSettings && typeSettings[collectionName] && typeSettings[collectionName].enabled === false;
        var ignoreCacheForQuery = dataQuery.ignoreCache;

        var isUnsupportedOffline = this.isQueryUnsupportedOffline(dataQuery);

        return operationShouldSkipCache || cacheDisabledForContentType || ignoreCacheForQuery || isUnsupportedOffline;
    },

    _cacheDataQuery: function (dataQuery) {
        if (this._shouldSkipCache(dataQuery)) {
            if (dataQuery.ignoreCache && !this.isQueryUnsupportedOffline(dataQuery)) {
                var hash = this._getHashForQuery(dataQuery);
                this._cacheQuery(dataQuery, hash);
            } else {
                this._everlive.data(dataQuery.collectionName)._sendRequest(dataQuery);
            }
        } else {
            dataQuery.useCache = false;
            this._processCacheItem(dataQuery);
        }
    },

    _processCacheItem: function (dataQuery) {
        var self = this;

        var contentType = dataQuery.collectionName;
        var hash = this._getHashForQuery(dataQuery);
        return this._getCacheDataForContentType(contentType)
            .then(function (cacheData) {
                if (cacheData[hash]) {
                    return self._isHashExpired(contentType, hash, dataQuery.maxAge)
                        .then(function (isExpired) {
                            if (isExpired && !dataQuery.forceCache) {
                                return self._purgeForHash(contentType, hash)
                                    .then(function () {
                                        return self._cacheQuery(dataQuery, hash);
                                    });
                            } else {
                                return self._everlive.offlineStorage.processQuery(dataQuery)
                                    .then(function (result) {
                                        dataQuery.onSuccess(result);
                                    })
                                    .catch(dataQuery.onError);
                            }
                        });
                } else {
                    return self._cacheQuery(dataQuery, hash);
                }
            });
    },

    _addObjectToCache: function (obj, contentType, maxAge) {
        var itemHash = obj.Id;
        return this._cacheResultFromDataQuery(contentType, itemHash, maxAge);
    },

    _cacheQuery: function (dataQuery, hash) {
        var self = this;
        var contentType = dataQuery.collectionName;

        var originalSuccess = dataQuery.onSuccess;
        dataQuery.onSuccess = function (response) {
            var args = arguments;

            return self._getCacheData()
                .then(function () {
                    var cacheForItems = [];
                    var result = response.result;

                    if (dataQuery.operation !== DataQuery.operations.count) {
                        if (Array.isArray(result)) {
                            _.each(result, function (singleResult) {
                                var cacheItemPromise = self._addObjectToCache(singleResult, dataQuery.collectionName);
                                cacheForItems.push(cacheItemPromise);
                            });
                        } else if (_.isObject(result)) {
                            var cacheItemPromise = self._addObjectToCache(result, dataQuery.collectionName);
                            cacheForItems.push(cacheItemPromise);
                        }
                    }

                    return rsvp.all(cacheForItems)
                        .then(function () {
                            if (dataQuery.operation !== DataQuery.operations.count) {
                                return self._cacheResultFromDataQuery(contentType, hash);
                            }
                        })
                        .then(function () {
                            return originalSuccess.apply(this, args);
                        });
                });
        };

        this._everlive.data(dataQuery.collectionName)._sendRequest(dataQuery);
    },

    _cacheResultFromDataQuery: function (contentType, hash) {
        var cacheData = {};
        cacheData[hash] = {
            cachedAt: Date.now()
        };

        return this._persistCacheData(contentType, cacheData);
    },

    _getExpirationForHash: function (contentType, hash) {
        return this._getCacheDataForContentType(contentType)
            .then(function (cacheData) {
                return cacheData[hash].cachedAt;
            });
    },

    _isHashExpired: function (contentType, hash, maxAge) {
        var self = this;

        return this._getExpirationForHash(contentType, hash)
            .then(function (cachedAt) {
                var maxAgeForContentType = self.typeSettings && self.typeSettings[contentType] ? self.typeSettings[contentType].maxAge * 60 * 1000 : null;
                var cacheAge = maxAge || maxAgeForContentType || self.maxAgeInMs;
                return (cachedAt + cacheAge) < Date.now();
            });
    },

    _purgeForHash: function (contentType, hash) {
        var cacheData = {};
        cacheData[hash] = null;

        return this._persistCacheData(contentType, cacheData);
    },

    _getHashForQuery: function (dataQuery) {
        if (dataQuery.operation === DataQuery.operations.readById) {
            return dataQuery.additionalOptions.id;
        }

        var queryParams = dataQuery.getQueryParameters();
        return this._hash(queryParams);
    },

    clear: function (contentType, success, error) {
        var self = this;

        return buildPromise(function (success, error) {
            return self.persister.purge(contentType, function () {
                delete self.cacheData[contentType];
                if (self._everlive.offlineStorage.setup.enabled) {
                    success();
                } else {
                    self._everlive.offlineStorage._queryProcessor._persister.purge(contentType, success, error);
                }
            }, error);
        }, success, error);
    },

    clearAll: function (success, error) {
        var self = this;
        self.cacheData = null;

        return buildPromise(function (success, error) {
            return self.persister.purgeAll(function () {
                if (self._everlive.offlineStorage.setup.enabled) {
                    success();
                } else {
                    self._everlive.offlineStorage._queryProcessor._persister.purgeAll(success, error);
                }
            }, error)
        }, success, error);
    }
};

module.exports = CacheModule;