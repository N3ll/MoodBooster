'use strict';
module.exports = (function () {
    var AuthenticationSetup = function (everlive, options) {
        options = options || {};
        this.onAuthenticationRequired = options.onAuthenticationRequired;
        this.persist = options.persist;
    };

    return AuthenticationSetup;
}());