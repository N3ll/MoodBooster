var _ = require('./common')._;
var constants = require('./constants');
var AuthenticationSetup = require('./auth/AuthenticationSetup');

module.exports = (function () {
    var everliveUrl = constants.everliveUrl;

    // An object that keeps information about an Everlive connection
    function Setup(options) {
        this.url = everliveUrl;
        this.apiKey = null;
        this.masterKey = null;
        this.token = null;
        this.tokenType = null;
        this.principalId = null;
        this.scheme = 'http'; // http or https
        this.parseOnlyCompleteDateTimeObjects = false;
        if (typeof options === 'string') {
            this.apiKey = options;
        } else {
            this._emulatorMode = options.emulatorMode;
            _.extend(this, options);
        }

        this.authentication = new AuthenticationSetup(this, options.authentication);
    }

    Setup.prototype.setAuthorizationProperties = function (token, tokenType, principalId) {
        this.token = token;
        this.tokenType = tokenType;
        this.principalId = principalId;
    };

    Setup.prototype.getAuthorizationProperties = function () {
        return {
            token: this.token,
            tokenType: this.tokenType,
            principalId: this.principalId
        };
    };

    return Setup;

}());