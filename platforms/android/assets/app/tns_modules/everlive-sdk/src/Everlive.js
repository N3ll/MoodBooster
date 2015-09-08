var Setup = require('./Setup');
var Data = require('./types/Data');
var usersModule = require('./types/Users');
var filesModule = require('./types/Files');
var constants = require('./constants');
var utils = require('./utils');
var buildAuthHeader = utils.buildAuthHeader;
var Push = require('./Push');
var Authentication = require('./auth/Authentication');
var offlineModule = require('./offline/offline');
var caching = require('./caching/caching');
var Request = require('./Request');
var common = require('./common');
var rsvp = common.rsvp;
var _ = common._;
var EverliveError = require('./EverliveError').EverliveError;
var EverliveErrors = require('./EverliveError').EverliveErrors;
var helpers = require('./helpers/helpers');
var EventEmitterProxy = require('./EventEmitterProxy');

// Registering mixins:
var mixins = require('./mixins/mixins');

module.exports = (function () {

    // The constructor of Everlive instances.
    // The entry point for the SDK.

    /**
     * @class Everlive
     * @classdesc The constructor of the {{site.bs}} (Everlive) JavaScript SDK. This is the entry point for the SDK.
     * @param {object|string} options - An object containing configuration options for the Setup object. Alternatively, you can pass a string representing your API key.
     * @param {string} options.apiKey - Your API key.
     * @param {string} [options.url=//api.everlive.com/v1/] - The {{site.TelerikBackendServices}} URL.
     * @param {string} [options.token] - An authentication token. The instance will be associated with the provided previously obtained token.
     * @param {string} [options.tokenType=bearer] - The type of the token that is used for authentication.
     * @param {string} [options.scheme=http] - The URI scheme used to make requests. Supported values: http, https
     * @param {boolean} [options.parseOnlyCompleteDateTimeObjects=false] - If set to true, the SDK will parse only complete date strings (according to the ISO 8601 standard).
     * @param {boolean} [options.emulatorMode=false] - Set this option to true to set the SDK in emulator mode.
     * @param {object|boolean} [options.offline] - Set this option to true to use the default offline settings.
	 * @param {boolean} [options.offline.enabled=false] - When using an object to initialize Offline Support with non-default settings, set this option to enable or disable Offline Support.
     * @param {boolean} [options.offline.isOnline=true] - Whether the storage is in online mode initially.
     * @param {ConflictResolutionStrategy|function} [options.offline.conflicts.strategy=ConflictResolutionStrategy.ClientWins] - A constant specifying the conflict resolution strategy or a function used to resolve the conflicts.
     * @param {StorageProvider|object} [options.offline.storage.provider=StorageProvider.LocalStorage] - An object specifying settings for the offline storage provider.
     * @param {string} [options.offline.storage.storagePath=el_store] - A relative path specifying where the files will be saved if file system is used for persistence for item metadata.
     * @param {number} [options.offline.storage.requestedQuota=10485760] - How much memory (in bytes) to be requested when using the file system for persistence. This option is only valid for Chrome as the other platforms use all the available space.
     * @param {string} [options.offline.encryption.key] - A key that will be used to encrypt the data stored offline.
     * @param {string} [options.offline.files.storagePath=el_file_store] - A relative path specifying where the files will be saved if file system is used for persistence of files in offline mode.
     * @param {string} [options.offline.files.metaPath=el_file_mapping] - A relative path specifying where the metadata file will be saved if file system is used for persistence of files in offline mode.
     * @param {object|boolean} [options.offline.files] - Set this option to true to enable support for files in offline mode.
     * @param {number} [options.offline.files.maxConcurrentDownloads] - The maximum amount of files that can be downloaded simultaneously.
     * @param {boolean} [options.authentication.persist=false] - Indicates whether the current user's authentication will be persisted.
     * @param {Function} [options.authentication.onAuthenticationRequired] - Invoked when the user's credentials have expired. Allowing you to perform custom logic.
     * @param {object} [options.helpers] - An object holding options for all Everlive helper components.
     * @param {object} [options.helpers.html] - HTML Helper configuration objects.
     * @param {boolean} [options.helpers.html.processOnLoad=false] - Whether to process all HTML elements when the window loads.
     * @param {boolean} [options.helpers.html.processOnResize=false] - Whether to process all HTML elements when the window resizes.
     * @param {string} [options.helpers.html.loadingImageUrl] - The image to be displayed while the original image is being processed.
     * @param {string} [options.helpers.html.errorImageUrl] - The image to be displayed when the original image processing fails.
     * @param {object} [options.helpers.html.attributes] - HTML Helper attributes configuration object.
     * @param {object} [options.helpers.html.attributes.loadingImage=data-loading-image] - A custom name for the attribute to be used to set a loading image.
     * @param {object} [options.helpers.html.attributes.errorImage=data-error-image] - A custom name for the attribute to be used to set an error image.
     * @param {object} [options.helpers.html.attributes.dpi=data-dpi] - A custom name for the attribute to be used to specify DPI settings.
     * @param {object} [options.helpers.html.attributes.imageSource=data-src] - A custom name for the attribute to be used to set the image source.
     * @param {object} [options.helpers.html.attributes.fileSource=data-href] - A custom name for the attribute to be used to set the anchor source.
     * @param {object} [options.helpers.html.attributes.enableOffline=data-offline] - A custom name for the attribute to be used to control offline processing.
     * @param {object} [options.helpers.html.attributes.enableResponsive=data-responsive] - A custom name for the attribute to be used to control Responsive Images processing.
     */
    function Everlive(options) {
        var self = this;
        this.setup = new Setup(options);
        _.each(initializations, function (init) {
            init.func.call(self, options);
        });

        if (Everlive.$ === null) {
            Everlive.$ = self;
        }

        EventEmitterProxy.apply(this);
    }

    /**
     * Adds an event listener to the SDK.
     * @method addListener
     * @param {String} eventName The name of the event to which to subscribe.
     * @param {Function} eventListener An event listener which will be called once the event is raised.
     * @memberOf Everlive.prototype
     */

    /**
     * Adds an event listener to the SDK.
     * @method on
     * @param {String} eventName The name of the event to which to subscribe.
     * @param {Function} eventListener An event listener which will be called once the event is raised.
     * @memberOf Everlive.prototype
     */

    /**
     * Removes an SDK event listener.
     * @method removeListener
     * @param {String} eventName The name of the event for which to stop listening.
     * @param {Function} eventListener The event listener to remove.
     * @memberOf Everlive.prototype
     */

    /**
     * Removes an SDK event listener.
     * @method off
     * @param {Function} eventListener
     * @memberOf Everlive.prototype
     */

    /**
     * Adds an event listener to the SDK which will be called only the first time the event is emitted.
     * @method once
     * @param {String} eventName The name of the event to which to subscribe.
     * @param {Function} eventListener An event listener which will be called once the event is raised.
     * @memberOf Everlive.prototype
     */

    /**
     * Removes all SDK event listeners.
     * @memberOf Everlive.prototype
     * @method removeAllListeners
     */

    /** Reference to the current {{site.TelerikBackendServices}} (Everlive) JavaScript SDK.
     * @memberOf Everlive
     * @type {Everlive}
     * @static
     */
    Everlive.$ = null;
    Everlive.idField = constants.idField;


    // An array keeping initialization functions called by the Everlive constructor.
    // These functions will be used to extend the functionality of an Everlive instance.
    var initializations = [];

    /** An array of functions that are invoked during instantiation of the {{site.TelerikBackendServices}} (Everlive) JavaScript SDK.
     * @memberOf Everlive
     * @type {Function[]}
     * @static
     * @private
     */
    Everlive.initializations = initializations;

    Everlive.init = function (options) {
        Everlive.$ = null;
        return new Everlive(options);
    };

    /**
     * Creates a new {@link Data} class.
     * @memberOf Everlive.prototype
     * @instance
     * @param {String} collectionName The name of the collection to be used.
     * @returns {Data}
     */
    Everlive.prototype.data = function (collectionName) {
        return new Data(this.setup, collectionName, this.offlineStorage, this);
    };

    /**
     * Returns the URL to the {{site.bs}} application endpoint that the SDK uses.
     * @memberOf Everlive.prototype
     * @method buildUrl
     * @returns {string} The generated URL.
     */
    Everlive.prototype.buildUrl = function () {
        return utils.buildUrl(this.setup);
    };

    /**
     * Generates the Authorization headers that are used by the {{site.TelerikBackendServices}} (Everlive) JavaScript SDK to make requests to the {{site.bs}} servers.
     * @memberOf Everlive
     * @returns {Object} AuthorizationHeaders The generated Authorization headers object.
     */
    Everlive.prototype.buildAuthHeader = function () {
        return buildAuthHeader(this.setup);
    };

    Everlive.disableRequestCache = utils.disableRequestCache;

    Everlive.AuthStatus = constants.AuthStatus;

    /**
     * Gets the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @memberOf Everlive.prototype
     * @method authInfo
     * @name authInfo
     * @deprecated
     * @see {@link Authentication.getAuthenticationStatus}
     * @returns {Promise} A promise to the authentication status.
     */
    /**
     * Gets the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @memberOf Everlive.prototype
     * @method authInfo
     * @name authInfo
     * @deprecated
     * @see {@link Authentication.getAuthenticationStatus}
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Everlive.prototype.authInfo = function (success, error) {
        var self = this;
        return utils.buildPromise(function (success, error) {
            var setup = self.setup;
            if (setup.masterKey) {
                return success({status: Everlive.AuthStatus.masterKey});
            }

            if (!setup.token) {
                return success({status: Everlive.AuthStatus.unauthenticated});
            }

            if (self.authentication && self.authentication.isAuthenticationInProgress()) {
                return success({status: Everlive.AuthStatus.authenticating});
            }

            self.Users
                .skipAuth(true)
                .currentUser()
                .then(function (res) {
                    return success({status: Everlive.AuthStatus.authenticated, user: res.result});
                }, function (err) {
                    if (self.authentication && self.authentication.isAuthenticationInProgress()) {
                        return success({status: Everlive.AuthStatus.authenticating});
                    } else if (err.code === EverliveErrors.invalidRequest.code || err.code === EverliveErrors.expiredToken.code) { // invalid request, i.e. the access token is invalid or missing
                        return success({status: Everlive.AuthStatus.invalidAuthentication});
                    } else {
                        return error(err);
                    }
                });
        }, success, error);
    };

    /**
     * Make a request to the current {{site.bs}} JavaScript SDK instance.
     * @method request
     * @memberOf Everlive.prototype
     * @param {object} options Object used to configure the request.
     * @param {object} [options.endpoint] The endpoint of the {{site.bs}} JavaScript API relative to the API key section. (For example, options.endpoint = MyType will make a request to the MyType type.)
     * @param {HttpMethod} [options.method] HTTP request method.
     * @param {object} [options.data] Data to be sent with the request.
     * @param {Function} [options.success] Success callback that will be called when the request finishes successfully.
     * @param {Function} [options.error] Error callback to be called in case of an error.
     * @param {object} [options.headers] Additional headers to be included in the request.
     * @param {Query|object} [options.filter] This is either a {@link Query} or a [filter]({% slug rest-api-querying-filtering %}) expression.
     * @param {boolean} [options.authHeaders=true] When set to false, no Authorization headers will be sent with the request.
     * @returns {function} The request configuration object containing the `send` function that sends the request.
     */
    Everlive.prototype.request = function (options) {
        return new Request(this.setup, options);
    };

    function protectOfflineEnabled() {
        if (!this._isOfflineStorageEnabled()) {
            throw new EverliveError('You have instantiated the SDK without support for offline storage');
        }
    }

    Everlive.prototype._isOfflineStorageEnabled = function () {
        var offlineStorageOptions = this.setup.offlineStorage || this.setup.offline;
        return offlineStorageOptions && offlineStorageOptions.enabled !== false;
    };

    /**
     * Sets the SDK to work in offline mode.
     * @method offline
     * @memberOf Everlive.prototype
     * @param {boolean} [isOffline = true] Boolean parameter for setting the SDK to online or offline mode.
     */
    Everlive.prototype.offline = function () {
        protectOfflineEnabled.call(this);

        var isOffline;
        if (arguments.length === 0) {
            isOffline = true;
        } else {
            isOffline = arguments[0] == true;
        }
        this.offlineStorage._setOffline(isOffline);
    };

    /**
     * Sets the SDK to work in online mode.
     * @method online
     * @memberOf Everlive.prototype
     * @param {boolean} [isOnline = true] Boolean parameter for setting the SDK to online or offline mode.
     */
    Everlive.prototype.online = function () {
        protectOfflineEnabled.call(this);

        var isOnline;
        if (arguments.length === 0) {
            isOnline = true;
        } else {
            isOnline = arguments[0] == true;
        }
        this.offlineStorage._setOffline(!isOnline);
    };

    /**
     * Check if the SDK is in offline mode.
     * @method isOffline
     * @memberOf Everlive.prototype
     * @returns {boolean} Returns true if the SDK is in offline mode.
     */
    Everlive.prototype.isOffline = function () {
        protectOfflineEnabled.call(this);
        return !this.isOnline();
    };

    /**
     * Check if the SDK is in online mode.
     * @method isOnline
     * @memberOf Everlive.prototype
     * @returns {boolean} Returns true if the SDK is in online mode.
     */
    Everlive.prototype.isOnline = function () {
        return this.offlineStorage.isOnline();
    };

    /**
     * Starts the synchronization procedure. Emits the 'syncStart' event when started and the 'syncEnd' event when the procedure finishes. 'syncEnd' contains information about the completed sync operation that you can use to find out how many items were synchronized.
     * @method sync
     * @memberOf Everlive.prototype
     */
    Everlive.prototype.sync = function () {
        protectOfflineEnabled.call(this);
        return this.offlineStorage.sync.apply(this.offlineStorage, arguments);
    };

    var initDefault = function initDefault() {
        var users = this.data('Users');
        usersModule.addUsersFunctions(users, this);

        /**
         * @memberOf Everlive
         * @instance
         * @deprecated
         * @see {@link Everlive.users}
         * @description An instance of the [Users]{@link Users} class for working with users.
         * @member {Users} Users
         */
        this.Users = users;

        /**
         * @memberOf Everlive
         * @instance
         * @description An instance of the [Users]{@link Users} class for working with users.
         * @member {Users} users
         */
        this.users = users;

        var files = this.data('Files');
        filesModule.addFilesFunctions(files);

        /**
         * @memberOf Everlive
         * @instance
         * @deprecated Use everlive.files instead
         * @see {@link Everlive.files}
         * @description An instance of the [Files]{@link Files} class for working with files.
         * @member {Files} Files
         */
        this.Files = files;

        /**
         * @memberOf Everlive
         * @instance
         * @description An instance of the [Files]{@link Files} class for working with files.
         * @member {Files} files
         */
        this.files = files;

        /**
         * @memberOf Everlive
         * @instance
         * @description An instance of the [Push]{@link Push} class for working with push notifications.
         * @member {Push} push
         */
        this.push = new Push(this);
    };

    var initAuthentication = function initAuthentication() {
        /**
         * @memberOf Everlive
         * @instance
         * @description An instance of the [Authentication]{@link Authentication} class for working with the authentication of the SDK.
         * @member {Authentication} authentication
         */
        /**
         * @memberOf Everlive
         * @instance
         * @description An instance of the [Authentication]{@link Authentication} class for working with the authentication of the SDK.
         * @member {authentication} authentication
         */
        this.authentication = this.Authentication = new Authentication(this, this.setup.authentication);
    };

    var initializeHelpers = function initializeHelpers(options) {
        var self = this;
        self.helpers = {};

        _.each(helpers, function (helper) {
            var helperOptions = options.helpers ? options.helpers[helper.name] : null;
            self.helpers[helper.name] = new helper.ctor(self, helperOptions);
        });
    };

    initializations.push({name: 'caching', func: caching.initCaching});
    initializations.push({name: 'offlineStorage', func: offlineModule.initOfflineStorage});
    initializations.push({name: 'cacheStore', func: caching._initStore});
    initializations.push({name: 'default', func: initDefault});
    initializations.push({name: 'authentication', func: initAuthentication});
    initializations.push({name: 'helpers', func: initializeHelpers});

    return Everlive;
}());
