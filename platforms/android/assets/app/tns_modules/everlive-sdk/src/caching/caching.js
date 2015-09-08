'use strict';

var CacheModule = require('./CacheModule');
var _ = require('../common')._;

var getDefaultOptions = function () {
    return {
        maxAge: 60,
        enabled: false,
        storage: {
            storagePath: 'el_cache'
        }
    }
};

module.exports = {
    initCaching: function (options) {
        var cachingOptions;
        var defaultOptions = getDefaultOptions();
        if (options.caching === true) {
            cachingOptions = _.deepExtend({}, defaultOptions);
            cachingOptions.enabled = true;
        } else {
            cachingOptions = _.deepExtend(defaultOptions, options.caching);
        }

        if (options.caching !== false) {
            this.setup.caching = cachingOptions;
        }

        this.cache = new CacheModule(cachingOptions, this);
    },
    _initStore: function (options) {
        this.cache._initStore(options);
    }
};