var constants = require('../constants');
var persisters = require('./offlinePersisters');
var LocalStoragePersister = persisters.LocalStoragePersister;
var FileSystemPersister = persisters.FileSystemPersister;
var OfflineStorageModule = require('./OfflineStorageModule');
var EverliveError = require('../EverliveError').EverliveError;
var isNativeScript = require('../everlive.platform').isNativeScript;
var common = require('../common');
var _ = common._;
var rsvp = common.rsvp;
var CryptographicProvider = require('../encryption/CryptographicProvider');

var defaultOfflineStorageOptions = {
    autoSync: true,
    enabled: true,
    conflicts: {
        strategy: constants.ConflictResolutionStrategy.ClientWins,
        implementation: null
    },
    offline: false,
    storage: {
        name: '',
        provider: isNativeScript ? constants.StorageProvider.FileSystem : constants.StorageProvider.LocalStorage,
        implementation: null,
        storagePath: constants.DefaultStoragePath
    },
    typeSettings: {},
    encryption: {
        provider: constants.EncryptionProvider.Default,
        implementation: null,
        key: ''
    },
    files: {
        storagePath: constants.DefaultFilesStoragePath,
        metaPath: constants.DefaultFilesMetadataPath,
        maxConcurrentDownloads: constants.MaxConcurrentDownloadTasks
    }
};

module.exports = (function () {

    var conflictResolutionStrategies = {};

    conflictResolutionStrategies[constants.ConflictResolutionStrategy.ClientWins] = function (collection, local, server) {
        return new rsvp.Promise(function (resolve) {
            resolve(local);
        });
    };

    conflictResolutionStrategies[constants.ConflictResolutionStrategy.ServerWins] = function (collection, local, server) {
        return new rsvp.Promise(function (resolve) {
            resolve(server);
        });
    };

    var initStoragePersister = function initStoragePersister(options) {
        var storageKey = options.storage.name || 'everliveOfflineStorage_' + this.setup.apiKey;
        var persister = persisters.getPersister(storageKey, options);
        options.storage.implementation = persister;
        return persister;
    };

    var initEncryptionProvider = function initEncryptionProvider(options) {
        var encryptor;
        var encryptionProvider = options.encryption.provider;
        var encryptionImplementation = options.encryption.implementation;
        if (_.isObject(encryptionImplementation) && encryptionProvider === constants.EncryptionProvider.Custom) {
            encryptor = encryptionImplementation;
        } else {
            switch (encryptionProvider) {
                case constants.EncryptionProvider.Default:
                    encryptor = new CryptographicProvider(options);
                    break;
                case constants.EncryptionProvider.Custom:
                    throw new EverliveError('Custom encryption provider requires an implementation object');
                default:
                    throw new EverliveError('Unsupported encryption provider ' + encryptionProvider);
            }
        }

        options.encryption.implementation = encryptor;
        return encryptor;
    };

    function buildOfflineStorageOptions(sdkOptions) {
        var storageOptions = sdkOptions.offline || sdkOptions.offlineStorage;
        var options;
        if (storageOptions === true) { // explicit check for shorthand initialization
            options = _.defaults({}, defaultOfflineStorageOptions);
        } else if (_.isObject(storageOptions)) {
            options = _.defaults(storageOptions, defaultOfflineStorageOptions);
            options.storage = _.defaults(storageOptions.storage, defaultOfflineStorageOptions.storage);
            options.encryption = _.defaults(storageOptions.encryption, defaultOfflineStorageOptions.encryption);
            options.conflicts = _.defaults(storageOptions.conflicts, defaultOfflineStorageOptions.conflicts);
            options.files = _.defaults(storageOptions.files, defaultOfflineStorageOptions.files);
        } else {
            options = _.defaults({}, defaultOfflineStorageOptions);
            options.enabled = false;
            if (!storageOptions) {
                sdkOptions.offlineStorage = options;
            }
        }

        options.cacheEnabled = sdkOptions.caching && sdkOptions.caching.enabled;
        return options;
    }

    var buildOfflineStorageModule = function buildOfflineStorageModule(sdkOptions) {
        var options = buildOfflineStorageOptions(sdkOptions);
        var persister = initStoragePersister.call(this, options);
        var encryptionProvider = initEncryptionProvider.call(this, options);

        return new OfflineStorageModule(this, options, persister, encryptionProvider);
    };

    var initOfflineStorage = function (options) {
        this.offlineStorage = buildOfflineStorageModule.call(this, options);
    };

    return {
        initOfflineStorage: initOfflineStorage,
        buildOfflineStorageOptions: buildOfflineStorageOptions
    }
}());