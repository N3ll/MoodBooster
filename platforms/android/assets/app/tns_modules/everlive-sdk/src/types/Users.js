/**
 * @class Users
 * @extends Data
 * @protected
 */

var utils = require('../utils');
var buildPromise = utils.buildPromise;
var guardUnset = utils.guardUnset;
var DataQuery = require('../query/DataQuery');
var Request = require('../Request');
var _ = require('../common')._;
var EverliveError = require('../EverliveError').EverliveError;
var EverliveErrors = require('../EverliveError').EverliveErrors;

module.exports.addUsersFunctions = function addUsersFunctions(ns, everlive) {

    /**
     * Registers a new user with username and password.
     * @memberOf Users.prototype
     * @method register
     * @name register
     * @param {string} username The new user's username.
     * @param {string} password The new user's password.
     * @param {object} userInfo Additional information for the user (ex. DisplayName, Email, etc.)
     * @returns {Promise} The promise for the request.
     */
    /**
     * Registers a new user using a username and a password.
     * @memberOf Users.prototype
     * @method register
     * @name register
     * @param {string} username The new user's username.
     * @param {string} password The new user's password.
     * @param attrs
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.register = function (username, password, attrs, success, error) {
        guardUnset(username, 'username');
        guardUnset(password, 'password');
        var user = {
            Username: username,
            Password: password
        };
        _.extend(user, attrs);
        return this.create(user, success, error);
    };

    /**
     * Gets information about the user that is currently authenticated to the {{site.bs}} JavaScript SDK. The success function is called with {@link Users.ResultTypes.curentUserResult}.
     * @memberOf Users.prototype
     * @method currentUser
     * @name currentUser
     * @returns {Promise} The promise for the request.
     */
    /**
     * Gets information about the user that is currently authenticated to the {{site.bs}} JavaScript SDK. The success function is called with {@link Users.ResultTypes.curentUserResult}.
     * @memberOf Users.prototype
     * @method currentUser
     * @name currentUser
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.currentUser = function (success, error) {
        var self = this;
        var id = self.everlive._isOfflineStorageEnabled() && self.everlive.isOffline() ? self.everlive.setup.principalId : 'me';
        return buildPromise(function (success, error) {
            if (id === 'me' && !self.everlive.setup.token && !self.everlive.setup.masterKey || !id) {
                return success({result: null});
            }

            self.getById(id).then(function (res) {
                    if (typeof res.result !== 'undefined') {
                        success({result: res.result});
                    } else {
                        success({result: null});
                    }
                },
                function (err) {
                    if (self.everlive.authentication && self.everlive.authentication.isAuthenticationInProgress()) {
                        success({result: null});
                    } else if (err.code === 601) { // invalid request, i.e. the access token is missing
                        success({result: null});
                    } else if (err.code === 801) {
                        error(new EverliveError(EverliveErrors.invalidToken));
                    } else {
                        error(err);
                    }
                }
            );
        }, success, error);
    };

    /**
     * Changes the password of a user.
     * @memberOf Users.prototype
     * @method changePassword
     * @name changePassword
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @param {string} newPassword The user's new password.
     * @param {boolean} keepTokens If set to true, the user tokens will be preserved even after the password change.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Changes the password of a user.
     * @memberOf Users.prototype
     * @method changePassword
     * @name changePassword
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @param {string} newPassword The user's new password.
     * @param {boolean} keepTokens If set to true, the user tokens will be preserved even after the password change.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.changePassword = function (username, password, newPassword, keepTokens, success, error) {
        var self = this;
        return buildPromise(function (success, error) {
            success = _.wrap(success, function (success, data) {
                if (data && data.result) {
                    if (!keepTokens) {
                        ns.clearAuthorization();
                    }
                }
                return success(data);
            });

            var dataQuery = new DataQuery({
                operation: DataQuery.operations.userChangePassword,
                collectionName: self.collectionName,
                data: {
                    Username: username,
                    Password: password,
                    NewPassword: newPassword
                },
                additionalOptions: {
                    keepTokens: keepTokens
                },
                skipAuth: true,
                onSuccess: success,
                onError: error
            });

            return self.processDataQuery(dataQuery)
        }, success, error)
    };

    /**
     *
     * Logs in a user using a username and a password to the current {{site.bs}} JavaScript SDK instance. All requests initiated by the current {{site.bs}} JavaScript SDK instance will be authenticated with that user's credentials.
     * @memberOf Users.prototype
     * @method login
     * @name login
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.login}
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Logs in a user using a username and a password to the current {{site.bs}} JavaScript SDK instance. All requests initiated by the current {{site.bs}} JavaScript SDK instance will be authenticated with that user's credentials.
     * @memberOf Users.prototype
     * @method login
     * @name login
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.login}
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.login = function (username, password, success, error) {
        return everlive.authentication.login(username, password, success, error);

    };

    /**
     * Log out the user who is currently logged in.
     * @memberOf Users.prototype
     * @method logout
     * @name logout
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.logout}
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log out the user who is currently logged in.
     * @memberOf Users.prototype
     * @method logout
     * @name logout
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.logout}
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.logout = function (success, error) {
        return everlive.authentication.logout(success, error);

    };

    /**
     * Log in a user using an Facebook access token.
     * @memberOf Users.prototype
     * @method loginWithFacebook
     * @name loginWithFacebook
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithFacebook}
     * @param {string} accessToken Facebook access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using an Facebook access token.
     * @memberOf Users.prototype
     * @method loginWithFacebook
     * @name loginWithFacebook
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithFacebook}
     * @param {string} accessToken Facebook access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.loginWithFacebook = function (accessToken, success, error) {
        return everlive.authentication.loginWithFacebook(accessToken, success, error);
    };

    /**
     * Links a {{site.TelerikBackendServices}} user account to a Facebook access token.
     * @memberOf Users.prototype
     * @method linkWithFacebook
     * @name linkWithFacebook
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Facebook access token that will be linked to the {{site.bs}} user account.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Links a Backend Services user with a Facebook access token.
     * @memberOf Users.prototype
     * @method linkWithFacebook
     * @name linkWithFacebook
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Facebook access token that will be linked to the {{site.bs}} user account.         * @param {Function} [success] a success callback.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.linkWithFacebook = function (userId, accessToken, success, error) {
        var identity = {
            Provider: 'Facebook',
            Token: accessToken
        };
        return ns._linkWithProvider(identity, userId, success, error);
    };

    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Facebook token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromFacebook
     * @name unlinkFromFacebook
     * @param {string} userId The user's ID in {{site.bs}}.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Facebook token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromFacebook
     * @name unlinkFromFacebook
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.unlinkFromFacebook = function (userId, success, error) {
        return ns._unlinkFromProvider('Facebook', userId, success, error);
    };

    /**
     * Log in a user using an ADFS access token.
     * @memberOf Users.prototype
     * @method loginWithADFS
     * @name loginWithADFS
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithADFS}
     * @param {string} accessToken ADFS access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using an ADFS access token.
     * @memberOf Users.prototype
     * @method loginWithADFS
     * @name loginWithADFS
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithADFS}
     * @param {string} accessToken ADFS access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.loginWithADFS = function (accessToken, success, error) {
        return everlive.authentication.loginWithADFS(accessToken, success, error);
    };

    /**
     * Links a {{site.TelerikBackendServices}} user account to an ADFS access token.
     * @memberOf Users.prototype
     * @method linkWithADFS
     * @name linkWithADFS
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The ADFS access token that will be linked to the {{site.bs}} user account.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Links a {{site.TelerikBackendServices}} user account to an ADFS access token.
     * @memberOf Users.prototype
     * @method linkWithADFS
     * @name linkWithADFS
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The ADFS access token that will be linked to the {{site.bs}} user account.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.linkWithADFS = function (userId, accessToken, success, error) {
        var identity = {
            Provider: 'ADFS',
            Token: accessToken
        };
        return ns._linkWithProvider(identity, userId, success, error);
    };

    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the ADFS token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromADFS
     * @name unlinkFromADFS
     * @param {string} userId The user's ID in {{site.bs}}.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the ADFS token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromADFS
     * @name unlinkFromADFS
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.unlinkFromADFS = function (userId, success, error) {
        return ns._unlinkFromProvider('ADFS', userId, success, error);
    };

    /**
     * Log in a user using a Microsoft Account access token.
     * @memberOf Users.prototype
     * @method loginWithLiveID
     * @name loginWithLiveID
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithLiveID}
     * @param {string} accessToken Microsoft Account access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using a Microsoft Account access token.
     * @memberOf Users.prototype
     * @method loginWithLiveID
     * @name loginWithLiveID
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithLiveID}
     * @param {string} accessToken Microsoft Account access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.loginWithLiveID = function (accessToken, success, error) {
        return everlive.authentication.loginWithLiveID(accessToken, success, error);
    };

    /**
     * Links a {{site.TelerikBackendServices}} user account to a Microsoft Account access token.
     * @memberOf Users.prototype
     * @method linkWithLiveID
     * @name linkWithLiveID
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Microsoft Account access token that will be linked to the {{site.bs}} user account.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Links a {{site.TelerikBackendServices}} user account to a Microsoft Account access token.
     * @memberOf Users.prototype
     * @method linkWithLiveID
     * @name linkWithLiveID
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Microsoft Account access token that will be linked to the {{site.bs}} user account.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.linkWithLiveID = function (userId, accessToken, success, error) {
        var identity = {
            Provider: 'LiveID',
            Token: accessToken
        };
        return ns._linkWithProvider(identity, userId, success, error);
    };

    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Microsoft Account access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromLiveID
     * @name unlinkFromLiveID
     * @param {string} userId The user's ID in {{site.bs}}.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Microsoft Account access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromLiveID
     * @name unlinkFromLiveID
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.unlinkFromLiveID = function (userId, success, error) {
        return ns._unlinkFromProvider('LiveID', userId, success, error);
    };

    /**
     * Log in a user using a Google access token.
     * @memberOf Users.prototype
     * @method loginWithGoogle
     * @name loginWithGoogle
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithGoogle}
     * @param {string} accessToken Google access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using a Google access token.
     * @memberOf Users.prototype
     * @method loginWithGoogle
     * @name loginWithGoogle
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithGoogle}
     * @param {string} accessToken Google access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.loginWithGoogle = function (accessToken, success, error) {
        return everlive.authentication.loginWithGoogle(accessToken, success, error);
    };

    /**
     * Links a {{site.TelerikBackendServices}} user account to a Google access token.
     * @memberOf Users.prototype
     * @method linkWithGoogle
     * @name linkWithGoogle
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Google access token that will be linked to the {{site.bs}} user account.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Links a {{site.TelerikBackendServices}} user account to a Google access token.
     * @memberOf Users.prototype
     * @method linkWithGoogle
     * @name linkWithGoogle
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Google access token that will be linked to the {{site.bs}} user account.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.linkWithGoogle = function (userId, accessToken, success, error) {
        var identity = {
            Provider: 'Google',
            Token: accessToken
        };

        return ns._linkWithProvider(identity, userId, success, error);
    };

    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Google access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromGoogle
     * @name unlinkFromGoogle
     * @param {string} userId The user's ID in {{site.bs}}.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Google access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromGoogle
     * @name unlinkFromGoogle
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.unlinkFromGoogle = function (userId, success, error) {
        return ns._unlinkFromProvider('Google', userId, success, error);
    };

    /**
     * Log in a user with a Twitter token. A secret token needs to be provided.
     * @memberOf Users.prototype
     * @method loginWithTwitter
     * @name loginWithTwitter
     * @param {string} token Twitter token.
     * @param {string} tokenSecret Twitter secret token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user with a Twitter token. A secret token needs to be provided.
     * @memberOf Users.prototype
     * @method loginWithTwitter
     * @name loginWithTwitter
     * @param {string} token Twitter token.
     * @param {string} tokenSecret Twitter secret token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.loginWithTwitter = function (token, tokenSecret, success, error) {
        return everlive.authentication.loginWithTwitter(token, tokenSecret, success, error);
    };

    /**
     * Links a {{site.TelerikBackendServices}} user to a Twitter token. A secret token needs to be provided.
     * @memberOf Users.prototype
     * @method linkWithTwitter
     * @name linkWithTwitter
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} token The Twitter access token that will be linked to the {{site.bs}} user account.
     * @param {string} tokenSecret The Twitter secret token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Links a {{site.TelerikBackendServices}} user to a Twitter token. A secret token needs to be provided.         * Links a Backend Services user with a Twitter token. A secret token needs to be provided.
     * @memberOf Users.prototype
     * @method linkWithTwitter
     * @name linkWithTwitter
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} token The Twitter access token that will be linked to the {{site.bs}} user account.
     * @param {string} tokenSecret The Twitter secret token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.linkWithTwitter = function (userId, token, tokenSecret, success, error) {
        var identity = {
            Provider: 'Twitter',
            Token: token,
            TokenSecret: tokenSecret
        };

        return ns._linkWithProvider(identity, userId, success, error);
    };

    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Twitter access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromTwitter
     * @name unlinkFromTwitter
     * @param {string} userId The user's ID in {{site.bs}}.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Twitter access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromTwitter
     * @name unlinkFromTwitter
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.unlinkFromTwitter = function (userId, success, error) {
        return ns._unlinkFromProvider('Twitter', userId, success, error);
    };

    /**
     * Sets the token and token type that the {{site.TelerikBackendServices}} JavaScript SDK will use for authorization.
     * @memberOf Users.prototype
     * @method setAuthorization
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.setAuthorization}
     * @param {string} token Token that will be used for authorization.
     * @param {Everlive.TokenType} tokenType Token type. Currently only 'bearer' token is supported.
     * @param {string} principalId The id of the user that is logged in.
     */
    ns.setAuthorization = function setAuthorization(token, tokenType, principalId) {
        everlive.authentication.setAuthorization(token, tokenType, principalId)
    };

    /**
     * Clears the authentication token that the {{site.bs}} JavaScript SDK currently uses. Note that this is different than logging out, because the current authorization token is not invalidated.
     * @method clearAuthorization
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.clearAuthorization}
     * @memberOf Users.prototype
     */
    ns.clearAuthorization = function clearAuthorization() {
        everlive.authentication.setAuthorization(null, null, null);
    };

    /**
     * Sends a password reset email to a specified user.
     * @memberOf Users.prototype
     * @method resetPassword
     * @name resetPassword
     * @param {Object} user The user object, which must container either username or email address.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Sends a password reset email to a specified user.
     * @memberOf Users.prototype
     * @method resetPassword
     * @name resetPassword
     * @param {Object} user The user object, which must container either username or email address.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.resetPassword = function (user, success, error) {
        var self = this;

        return buildPromise(function (successCb, errorCb) {
            var dataQuery = new DataQuery({
                operation: DataQuery.operations.userResetPassword,
                collectionName: self.collectionName,
                data: user,
                onSuccess: successCb,
                onError: errorCb
            });

            return self.processDataQuery(dataQuery);
        }, success, error);
    };

    /**
     * Set a new password for a user using a password reset code.
     * @memberOf Users.prototype
     * @method setPassword
     * @name setPassword
     * @param {object} setPasswordObject The object, which contains information necessary for changing the user password.
     * @param {string} setPasswordObject.ResetCode The reset code obtained using a password reset email.
     * @param {string} setPasswordObject.NewPassword The new password for the user.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Set a new password for a user using a password reset code.
     * @memberOf Users.prototype
     * @method setPassword
     * @name setPassword
     * @param {object} setPasswordObject The object, which contains information necessary for changing the user password.
     * @param {string} setPasswordObject.ResetCode The reset code obtained using a password reset email.
     * @param {string} setPasswordObject.NewPassword The new password for the user.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    /**
     * Set a new password for a user using a password reset code.
     * @memberOf Users.prototype
     * @method setPassword
     * @name setPassword
     * @param {object} setPasswordObject The object, which contains information necessary for changing the user password.
     * @param {number} setPasswordObject.Username The username that the password will be changed.
     * @param {number} setPasswordObject.SecretQuestionId The id of the secret question.
     * @param {string} setPasswordObject.SecretAnswer The answer to the secret question.
     * @param {string} setPasswordObject.NewPassword The new password for the user.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Set a new password for a user using a password reset code.
     * @memberOf Users.prototype
     * @method setPassword
     * @name setPassword
     * @param {object} setPasswordObject The object, which contains information necessary for changing the user password.
     * @param {number} setPasswordObject.Username The username that the password will be changed.
     * @param {number} setPasswordObject.SecretQuestionId The id of the secret question.
     * @param {string} setPasswordObject.SecretAnswer The answer to the secret question.
     * @param {string} setPasswordObject.NewPassword The new password for the user.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.setPassword = function (setPasswordObject, success, error) {
        var self = this;

        return buildPromise(function (successCb, errorCb) {
            var dataQuery = new DataQuery({
                operation: DataQuery.operations.userSetPassword,
                collectionName: self.collectionName,
                data: setPasswordObject,
                onSuccess: successCb,
                onError: errorCb
            });

            return self.processDataQuery(dataQuery);
        }, success, error);
    };

    ns._linkWithProvider = function (identity, userId, success, error) {
        var self = this;
        return buildPromise(function (success, error) {
            var query = new DataQuery({
                additionalOptions: {
                    id: userId
                },
                operation: DataQuery.operations.userLinkWithProvider,
                collectionName: self.collectionName,
                data: identity,
                parse: Request.parsers.single,
                skipAuth: true,
                onSuccess: success,
                onError: error
            });

            return self.processDataQuery(query);
        }, success, error);
    };

    ns._unlinkFromProvider = function (providerName, userId, success, error) {
        var identity = {
            Provider: providerName
        };
        var self = this;
        return buildPromise(function (success, error) {
            var query = new DataQuery({
                additionalOptions: {
                    userId: userId
                },
                operation: DataQuery.operations.userUnlinkFromProvider,
                collectionName: self.collectionName,
                data: identity,
                parse: Request.parsers.single,
                skipAuth: true,
                onSuccess: success,
                onError: error
            });

            return self.processDataQuery(query);
        }, success, error);
    };
};