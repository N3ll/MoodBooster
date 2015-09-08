'use strict';
var utils = require('../utils');
var DataQuery = require('../query/DataQuery');
var Request = require('../Request');
var Everlive = require('../Everlive');
var constants = require('../constants');
var usersCollectionName = 'Users';
var buildPromise = utils.buildPromise;
var LocalStore = require('../storages/LocalStore');
var EverliveErrors = require('../EverliveError').EverliveErrors;

module.exports = (function () {
    /**
     * @class Authentication
     * @classdesc A class for managing authentication of a user in your application.
     * @protected
     * @param el {Everlive} Everlive Object
     * @param setup {AuthSetup} the authentication setup object
     */
    var Authentication = function (el, setup) {
        this.authSetup = setup || {};
        this._el = el;
        this._authenticationCallbacks = null;
        if (this.authSetup.persist) {
            this._localStore = new LocalStore(el);
            var localStoreKey = this._getLocalStoreKey();
            var authOptions = this._localStore.getItem(localStoreKey);
            var authInfo;
            if (authOptions) {
                authInfo = JSON.parse(this._localStore.getItem(localStoreKey));
            }
            if (authInfo) {
                this._el.setup.setAuthorizationProperties(authInfo.token, authInfo.tokenType, authInfo.principalId);
            }
        }
    };

    /**
     *
     * Logs in a user using a username and a password to the current {{site.bs}} JavaScript SDK instance. All requests initiated by the current {{site.bs}} JavaScript SDK instance will be authenticated with that user's credentials.
     * @memberOf Authentication.prototype
     * @method login
     * @name login
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Logs in a user using a username and a password to the current {{site.bs}} JavaScript SDK instance. All requests initiated by the current {{site.bs}} JavaScript SDK instance will be authenticated with that user's credentials.
     * @memberOf Authentication.prototype
     * @method login
     * @name login
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.login = function (username, password, success, error) {
        var self = this;
        return buildPromise(function (success, error) {
            var successFunc = function () {
                self._loginSuccess.apply(self, arguments);
                success.apply(null, arguments);
            };

            var query = new DataQuery({
                operation: DataQuery.operations.userLogin,
                collectionName: usersCollectionName,
                data: {
                    username: username,
                    password: password,
                    grant_type: 'password'
                },
                skipAuth: true,
                onSuccess: successFunc,
                onError: error
            });

            return self._el.Users.processDataQuery(query);
        }, success, error);
    };

    /**
     * Log out the user who is currently logged in.
     * @memberOf Authentication.prototype
     * @method logout
     * @name logout
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log out the user who is currently logged in.
     * @memberOf Authentication.prototype
     * @method logout
     * @name logout
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.logout = function (success, error) {
        var self = this;
        return buildPromise(function (success, error) {
            var successFunc = function () {
                self._logoutSuccess.apply(self, arguments);
                success.apply(null, arguments);
            };

            var errorFunc = function (err) {
                if (err.code === 301) { //invalid token
                    self.clearAuthorization();
                }

                error.apply(null, arguments);
            };

            var query = new DataQuery({
                operation: DataQuery.operations.userLogout,
                collectionName: usersCollectionName,
                skipAuth: true,
                onSuccess: successFunc,
                onError: errorFunc
            });

            return self._el.Users.processDataQuery(query);
        }, success, error);
    };

    Authentication.prototype._getLocalStoreKey = function () {
        return constants.AuthStoreKey + this._el.setup.apiKey + '$authentication';
    };

    /**
     * Log in a user using an Facebook access token.
     * @memberOf Authentication.prototype
     * @method loginWithFacebook
     * @name loginWithFacebook
     * @param {string} accessToken Facebook access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using an Facebook access token.
     * @memberOf Authentication.prototype
     * @method loginWithFacebook
     * @name loginWithFacebook
     * @param {string} accessToken Facebook access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.loginWithFacebook = function (accessToken, success, error) {
        var identity = {
            Provider: 'Facebook',
            Token: accessToken
        };
        return this._loginWithProvider(identity, success, error);
    };

    /**
     * Log in a user using an ADFS access token.
     * @memberOf Authentication.prototype
     * @method loginWithADFS
     * @name loginWithADFS
     * @param {string} accessToken ADFS access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using an ADFS access token.
     * @memberOf Authentication.prototype
     * @method loginWithADFS
     * @name loginWithADFS
     * @param {string} accessToken ADFS access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.loginWithADFS = function (accessToken, success, error) {
        var identity = {
            Provider: 'ADFS',
            Token: accessToken
        };
        return this._loginWithProvider(identity, success, error);
    };

    /**
     * Log in a user using a LiveID access token.
     * @memberOf Authentication.prototype
     * @method loginWithLiveID
     * @name loginWithLiveID
     * @param {string} accessToken LiveID access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using a LiveID access token.
     * @memberOf Authentication.prototype
     * @method loginWithLiveID
     * @name loginWithLiveID
     * @param {string} accessToken LiveID access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.loginWithLiveID = function (accessToken, success, error) {
        var identity = {
            Provider: 'LiveID',
            Token: accessToken
        };
        return this._loginWithProvider(identity, success, error);
    };

    /**
     * Log in a user using a Google access token.
     * @memberOf Authentication.prototype
     * @method loginWithGoogle
     * @name loginWithGoogle
     * @param {string} accessToken Google access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using a Google access token.
     * @memberOf Authentication.prototype
     * @method loginWithGoogle
     * @name loginWithGoogle
     * @param {string} accessToken Google access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.loginWithGoogle = function (accessToken, success, error) {
        var identity = {
            Provider: 'Google',
            Token: accessToken
        };

        return this._loginWithProvider(identity, success, error);
    };

    /**
     * Log in a user with a Twitter token. A secret token needs to be provided.
     * @memberOf Authentication.prototype
     * @method loginWithTwitter
     * @name loginWithTwitter
     * @param {string} token Twitter token.
     * @param {string} tokenSecret Twitter secret token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user with a Twitter token. A secret token needs to be provided.
     * @memberOf Authentication.prototype
     * @method loginWithTwitter
     * @name loginWithTwitter
     * @param {string} token Twitter token.
     * @param {string} tokenSecret Twitter secret token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.loginWithTwitter = function (token, tokenSecret, success, error) {
        var identity = {
            Provider: 'Twitter',
            Token: token,
            TokenSecret: tokenSecret
        };

        return this._loginWithProvider(identity, success, error);
    };

    /**
     * Sets the token and token type that the {{site.TelerikBackendServices}} JavaScript SDK will use for authorization.
     * @memberOf Authentication.prototype
     * @method setAuthorization
     * @param {string} token Token that will be used for authorization.
     * @param {Everlive.TokenType} tokenType Token type. Currently only 'bearer' token is supported.
     * @param {string} principalId The id of the user that is logged in.
     */
    Authentication.prototype.setAuthorization = function setAuthorization(token, tokenType, principalId) {
        this._el.setup.setAuthorizationProperties(token, tokenType, principalId);

        if (this.authSetup.persist) {
            var localStoreKey = this._getLocalStoreKey();
            var authorizationProperties = this._el.setup.getAuthorizationProperties();
            this._localStore.setItem(localStoreKey, JSON.stringify(authorizationProperties));
        }

        if (this._authenticationCallbacks) {
            this._authenticationCallbacks.success();
            this._authenticationCallbacks = null;
        }
    };

    /**
     * Clears the authentication token that the {{site.bs}} JavaScript SDK currently uses. Note that this is different than logging out, because the authorization token that was used, will not be invalidated.
     * @method clearAuthorization
     * @memberOf Authentication.prototype
     */
    Authentication.prototype.clearAuthorization = function clearAuthorization() {
        this.setAuthorization(null, null, null);
        this.clearPersistedAuthentication();
    };

    /**
     * Clears the current persisted authentication from the local store for the current {{site.bs}} JavaScript SDK instance. Will not logout or modify the current authentication of the Javascript SDK.
     * @method clearPersistedAuthentication
     * @memberOf Authentication.prototype
     */
    Authentication.prototype.clearPersistedAuthentication = function () {
        if (this._localStore) {
            var localStoreKey = this._getLocalStoreKey();
            this._localStore.removeItem(localStoreKey);
            this._el.setup.setAuthorizationProperties(null, null, null);
        }
    };

    /**
     * @memberOf Authentication.prototype
     * Returns whether authentication requirement is enabled for the current instance of the {{site.bs}} JavaScript SDK.
     * @returns {boolean} whether an onAuthenticationRequired function is provided
     */
    Authentication.prototype.isAuthenticationInProgress = function () {
        return typeof this.authSetup.onAuthenticationRequired === 'function';
    };

    /** Ensures that authentication is completed before continuing.
     * @memberOf Authentication.prototype
     * @private
     * @returns {Promise} A promise that will be resolved when the authentication is complete. See {{@link Everlive.prototype.completeAuthentication}}.
     * @throws throws an error if no onAuthenticationRequired handler is provided to the setup.
     */
    Authentication.prototype._ensureAuthentication = function () {
        if (!this.isAuthenticationInProgress()) {
            throw new Error('onAuthenticationRequired option of Everlive.Setup.Authentication is required.');
        }
        if (this.isAuthenticating()) {
            return this._authenticationCallbacks.promise;
        }

        this.clearAuthorization();
        this.authSetup.onAuthenticationRequired.call(this);
        this._authenticationCallbacks = utils.getCallbacks();
        return this._authenticationCallbacks.promise;
    };

    /**
     * A method that should be called with the authentication result.
     * @memberOf Authentication.prototype
     * @param authentication authentication object containing information about the
     * @param authentication.access_token
     * @param authentication.token_type
     * @param authentication.principal_id
     */
    Authentication.prototype.completeAuthentication = function (authentication) {
        this._el.setAuthorization(authentication.access_token, authentication.token_type, authentication.principal_id);
    };
    /**
     * Gets the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @memberOf Authentication.prototype
     * @method getAuthenticationStatus
     * @name getAuthenticationStatus
     * @returns {Promise} A promise to the authentication status.
     */
    /**
     * Gets the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @memberOf Authentication.prototype
     * @method getAuthenticationStatus
     * @name getAuthenticationStatus
     * @param {Everlive.Callbacks.authenticationStatusSuccess} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.getAuthenticationStatus = function (success, error) {
        var self = this;
        return utils.buildPromise(function (success, error) {
            var setup = self._el.setup;
            if (setup.masterKey) {
                return success({status: constants.AuthStatus.masterKey});
            }

            if (!setup.token) {
                return success({status: constants.AuthStatus.unauthenticated});
            }

            if (self.isAuthenticationInProgress()) {
                return success({status: constants.AuthStatus.authenticating});
            }

            self._el.Users
                .skipAuth(true)
                .currentUser()
                .then(function (res) {
                    return success({status: constants.AuthStatus.authenticated, user: res.result});
                }, function (err) {
                    if (self.isAuthenticationInProgress()) {
                        return success({status: constants.AuthStatus.authenticating});
                    } else if (err.code === EverliveErrors.invalidRequest.code || err.code === EverliveErrors.invalidToken.code) { // invalid request, i.e. the access token is invalid or missing
                        return success({status: constants.AuthStatus.invalidAuthentication});
                    } else if (err.code === EverliveErrors.expiredToken.code) {
                        return success({status: constants.AuthStatus.expiredAuthentication});
                    } else {
                        return error(err);
                    }
                });
        }, success, error);
    };

    /** Returns whether the {{site.TelerikBackendServices}} is currently waiting for authentication to be completed. See {{@link Everlive.prototype.completeAuthentication}}.
     * @memberOf Everlive.prototype
     * @returns {boolean}
     */
    Authentication.prototype.isAuthenticating = function () {
        return !!this._authenticationCallbacks;
    };

    Authentication.prototype._loginSuccess = function (data) {
        var result = data.result;
        this.setAuthorization(result.access_token, result.token_type, result.principal_id);
    };

    Authentication.prototype._logoutSuccess = function () {
        this.clearAuthorization();
    };

    Authentication.prototype._loginWithProvider = function (identity, success, error) {
        var user = {
            Identity: identity
        };
        var self = this;
        return buildPromise(function (success, error) {
            var successFunc = function () {
                self._loginSuccess.apply(self, arguments);
                success.apply(null, arguments);
            };

            var query = new DataQuery({
                operation: DataQuery.operations.userLoginWithProvider,
                collectionName: usersCollectionName,
                data: user,
                authHeaders: false,
                skipAuth: true,
                parse: Request.parsers.single,
                onSuccess: successFunc,
                onError: error
            });

            self._el.Users.processDataQuery(query);
        }, success, error);
    };

    return Authentication;
}());
