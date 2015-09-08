/**
 * Constants used by the SDK
 * @typedef {Object} Everlive.Constants
 */

var constants = {
    idField: 'Id',
    guidEmpty: '00000000-0000-0000-0000-000000000000',
    everliveUrl: '//api.everlive.com/v1/',
    /**
     * A class used to represent the conflict resolution strategies.
     * @property {string} ClientWins
     * @property {string} ServerWins
     * @property {string} Custom
     * @typedef {string} Everlive.Constants.ConflictResolutionStrategy
     */
    ConflictResolutionStrategy: {
        ClientWins: 'clientWins',
        ServerWins: 'serverWins',
        Custom: 'custom'
    },
    ConflictResolution: {
        KeepServer: 'keepServer',
        KeepClient: 'keepClient',
        Custom: 'custom',
        Skip: 'skip'
    },
    /**
     * A class used to represent the available storage providers.
     * @property {string} LocalStorage
     * @property {string} FileSystem
     * @property {string} Custom
     * @typedef {string} Everlive.Constants.StorageProvider
     */
    StorageProvider: {
        LocalStorage: 'localStorage',
        FileSystem: 'fileSystem',
        Custom: 'custom'
    },

    DefaultStoragePath: 'el_store',

    // the default location for storing files offline
    DefaultFilesStoragePath: 'el_file_store',

    // the default location for storing offline to online location map
    DefaultFilesMetadataPath: 'el_file_mapping',

    EncryptionProvider: {
        Default: 'default',
        Custom: 'custom'
    },

    // The headers used by the Everlive services
    Headers: {
        filter: 'X-Everlive-Filter',
        select: 'X-Everlive-Fields',
        sort: 'X-Everlive-Sort',
        skip: 'X-Everlive-Skip',
        take: 'X-Everlive-Take',
        expand: 'X-Everlive-Expand',
        singleField: 'X-Everlive-Single-Field',
        includeCount: 'X-Everlive-Include-Count',
        powerFields: 'X-Everlive-Power-Fields',
        debug: 'X-Everlive-Debug',
        overrideSystemFields: 'X-Everlive-Override-System-Fields',
        sdk: 'X-Everlive-Sdk',
        sync: 'X-Everlive-Sync'
    },
    //Constants for different platforms in Everlive
    Platform: {
        WindowsPhone: 1,
        Windows: 2,
        Android: 3,
        iOS: 4,
        OSX: 5,
        Blackberry: 6,
        Nokia: 7,
        Unknown: 100
    },
    OperatorType: {
        query: 1,

        where: 100,
        filter: 101,

        and: 110,
        or: 111,
        not: 112,

        equal: 120,
        not_equal: 121,
        lt: 122,
        lte: 123,
        gt: 124,
        gte: 125,
        isin: 126,
        notin: 127,
        all: 128,
        size: 129,
        regex: 130,
        contains: 131,
        startsWith: 132,
        endsWith: 133,

        nearShpere: 140,
        withinBox: 141,
        withinPolygon: 142,
        withinShpere: 143,

        select: 200,
        exclude: 201,

        order: 300,
        order_desc: 301,

        skip: 400,
        take: 401,
        expand: 402
    },

    /**
     * A class used to represent the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @property {string} unauthenticated Indicates that no user is authenticated.
     * @property {string} masterKey Indicates that a master key authentication is used.
     * @property {string} invalidAuthentication Indicates an authentication has been attempted, but it was invalid.
     * @property {string} authenticated Indicates that a user is authenticated.
     * @property {string} authenticating Indicates that a user is currently authenticating. Some requests might be pending and waiting for the user to authenticate.
     * @property {string} expiredAuthentication Indicates that a user's authentication has expired and that the user must log back in.
     * @typedef {string} Everlive.AuthStatus
     */
    AuthStatus: {
        unauthenticated: 'unauthenticated',
        masterKey: 'masterKey',
        invalidAuthentication: 'invalidAuthentication',
        authenticated: 'authenticated',
        expiredAuthentication: 'expiredAuthentication',
        authenticating: 'authenticating'
    },
    offlineItemStates: {
        created: 'create',
        modified: 'update',
        deleted: 'delete'
    },

    /**
     * HTTP Methods
     * @enum {string}
     */
    HttpMethod: {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        DELETE: 'DELETE'
    },
    maxDistanceConsts: {
        radians: '$maxDistance',
        km: '$maxDistanceInKilometers',
        miles: '$maxDistanceInMiles'
    },
    radiusConsts: {
        radians: 'radius',
        km: 'radiusInKilometers',
        miles: 'radiusInMiles'
    }
};

// using an invalid field name in the context of Everlive
// to ensure no naming collisions can occur
constants.offlineItemsStateMarker = '__everlive_offline_state';

constants.SyncErrors = {
    generalError: 'generalError',
    itemSyncError: 'itemSyncError'
};

constants.syncBatchSize = 10;

constants.AuthStoreKey = '__everlive_auth_key';

constants.CachingStoreKey = '__everlive_cache';

// the minimum interval between sync requests
constants.defaultSyncInterval = 1000 * 60 * 10; // 10 minutes
constants.fileUploadKey = 'fileUpload';
constants.fileUploadDelimiter = '_';

constants.FilesTypeNameLegacy = 'system.files';
constants.FilesTypeName = 'Files';

constants.MaxConcurrentDownloadTasks = 3;

module.exports = constants;
