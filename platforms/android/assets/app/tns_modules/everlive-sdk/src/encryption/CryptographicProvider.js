var CryptoJS = require('node-cryptojs-aes').CryptoJS;
var AES = CryptoJS.AES;

module.exports = (function () {

    function CryptographicProvider(options) {
        this.options = options;
    }

    CryptographicProvider.prototype = {
        _getKey: function () {
            return this.options.encryption.key;
        },

        _canEncryptDecrypt: function (content) {
            return this._getKey() && content !== null && content !== undefined;
        },

        encrypt: function (content) {
            if (!this._canEncryptDecrypt(content)) {
                return content;
            }

            return AES.encrypt(content, this._getKey()).toString();
        },

        decrypt: function (content) {
            if (!this._canEncryptDecrypt(content)) {
                return content;
            }

            return AES.decrypt(content, this._getKey()).toString(CryptoJS.enc.Utf8);
        }
    };

    return CryptographicProvider;
}());