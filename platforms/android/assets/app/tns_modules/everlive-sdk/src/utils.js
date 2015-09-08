var EverliveError = require('./EverliveError').EverliveError;
var common = require('./common');
var _ = common._;
var rsvp = common.rsvp;
var Everlive = require('./Everlive');
var platform = require('./everlive.platform');
var path = require('path');

var utils = {};

utils.guardUnset = function guardUnset(value, name, message) {
    if (!message) {
        message = 'The ' + name + ' is required';
    }
    if (typeof value === 'undefined' || value === null) {
        throw new EverliveError(message);
    }
};

utils.parseUtilities = {
    getReviver: function (parseOnlyCompleteDateTimeString) {
        var dateParser;
        if (parseOnlyCompleteDateTimeString) {
            dateParser = utils.parseUtilities.parseIsoDateString;
        } else {
            dateParser = utils.parseUtilities.parseOnlyCompleteDateTimeString;
        }

        return function (key, value) {
            if (typeof value === 'string') {
                var date = dateParser(value);
                if (date) {
                    value = date;
                }
            }

            return value;
        };
    },

    parseIsoDateString: function (string) {
        var match;
        if (match = string.match(/^(\d{4})(-(\d{2})(-(\d{2})(T(\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|((\+|-)(\d{2}):(\d{2}))))?))$/)) {
            // DateTime
            var secondParts = match[12];
            if (secondParts) {
                if (secondParts.length > 3) {
                    secondParts = Math.round(Number(secondParts.substr(0, 3) + '.' + secondParts.substr(3)));
                }
                else if (secondParts.length < 3) {
                    // if the secondParts are one or two characters then two or one zeros should be appended
                    // in order to have the correct number for milliseconds ('.67' means 670ms not 67ms)
                    secondParts += secondParts.length === 2 ? '0' : '00';
                }
            }
            var date = new Date(
                Date.UTC(
                    Number(match[1]), // year
                    (Number(match[3]) - 1) || 0, // month
                    Number(match[5]) || 0, // day
                    Number(match[7]) || 0, // hour
                    Number(match[8]) || 0, // minute
                    Number(match[10]) || 0, // second
                    Number(secondParts) || 0
                )
            );

            if (match[13] && match[13] !== "Z") {
                var h = Number(match[16]) || 0,
                    m = Number(match[17]) || 0;

                h *= 3600000;
                m *= 60000;

                var offset = h + m;
                if (match[15] === "+")
                    offset = -offset;

                date = new Date(date.valueOf() + offset);
            }

            return date;
        } else {
            return null;
        }
    },

    parseOnlyCompleteDateTimeString: function (string) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(string)) {
            // Date
            return null;
        }

        if (/^(\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|((\+|-)(\d{2}):(\d{2})))?$/.test(string)) {
            // Time
            return null;
        }

        return utils.parseUtilities.parseIsoDateString(string);
    },

    traverse: function (obj, func) {
        var key, value, newValue;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                value = obj[key];
                newValue = func(key, value);
                obj[key] = newValue;
                if (value === newValue && typeof value === 'object') {
                    utils.parseUtilities.traverse(value, func);
                }
            }
        }
        return obj;
    },

    traverseAndRevive: function (data, reviver) {
        if (!reviver) {
            reviver = utils.parseUtilities.getReviver();
        }

        return utils.parseUtilities.traverse(data, reviver);
    },

    parseError: function (reviver, error) {
        if (typeof error === 'string' && error.length > 0) {
            try {
                error = JSON.parse(error);
                return {message: error.message, code: error.errorCode};
            } catch (e) {
                return error;
            }
        } else {
            return error;
        }
    },

    _parseInternal: function (reviver, data) {
        if (typeof data === 'string' && data.length > 0) {
            data = JSON.parse(data, reviver);
        } else if (typeof data === 'object') {
            utils.parseUtilities.traverseAndRevive(data, reviver);
        }

        return data;
    },

    _transformResult: function (data, additionalProperties) {
        if (data) {
            var result = {result: data.Result};
            _.extend(result, additionalProperties);
            return result;
        } else {
            return data;
        }
    },

    parseResult: function (reviver, data) {
        data = utils.parseUtilities._parseInternal.apply(null, arguments);
        return utils.parseUtilities._transformResult(data, {count: data.Count});
    },

    parseSingleResult: function (reviver, data) {
        data = utils.parseUtilities._parseInternal.apply(null, arguments);
        return utils.parseUtilities._transformResult(data);
    },

    parseUpdateResult: function (reviver, data) {
        data = utils.parseUtilities._parseInternal.apply(null, arguments);
        return utils.parseUtilities._transformResult(data, {ModifiedAt: data.ModifiedAt});
    },

    parseJSON: function (json) {
        return JSON.parse(json, utils.parseUtilities.getReviver());
    }
};

utils.buildPromise = function buildPromise(operation, success, error) {
    var callbacks = utils.getCallbacks(success, error);
    operation(callbacks.success, callbacks.error);
    return callbacks.promise;
};

utils.getCallbacks = function (success, error) {
    var promise;
    var createPromise = function () {
        return new rsvp.Promise(function (resolve, reject) {
            success = function (data) {
                resolve(data);
            };
            error = function (error) {
                reject(error);
            };
        });
    };

    if (platform.isNodejs) {
        // node js style continuation
        if (typeof success === 'function' && typeof error !== 'function') {
            var callback = success;
            success = function (data, response) {
                callback(null, data, response);
            };
            error = function (error) {
                callback(error);
            };
        } else if (typeof success !== 'function' && typeof error !== 'function') {
            promise = createPromise();
        }
    } else {
        if (typeof success !== 'function' && typeof error !== 'function') {
            promise = createPromise();
        }
    }

    return {promise: promise, success: success, error: error};
};

utils.buildAuthHeader = function buildAuthHeader(setup, options) {
    var authHeaderValue = null;
    if (options && options.authHeaders === false) {
        return authHeaderValue;
    }
    if (setup.token) {
        authHeaderValue = (setup.tokenType || 'bearer') + ' ' + setup.token;
    }
    else if (setup.masterKey) {
        authHeaderValue = 'masterkey ' + setup.masterKey;
    }
    if (authHeaderValue) {
        return {Authorization: authHeaderValue};
    } else {
        return null;
    }
};

utils.DeviceRegistrationResult = function DeviceRegistrationResult(token) {
    this.token = token;
};

utils.cloneDate = function (date) {
    return new Date(date);
};

utils.buildUrl = function (setup) {
    var url = '';
    if (typeof setup.scheme === 'string') {
        url += setup.scheme + ':';
    }
    url += setup.url;
    if (setup.apiKey) {
        url += setup.apiKey + '/';
    }
    return url;
};

utils.getDbOperators = function (expression, shallow) {
    var dbOperators = [];

    if (typeof expression === 'string') {
        return dbOperators;
    }

    var modifierKeys = Object.keys(expression || {});
    _.each(modifierKeys, function (key) {
        if (key.indexOf('$') === 0) {
            dbOperators.push(key);
        } else if (typeof expression[key] === 'object' && !shallow) {
            dbOperators = dbOperators.concat(utils.getDbOperators(expression[key]));
        }
    });

    return dbOperators;
};

utils.disableRequestCache = function (url, method) {
    if (method === 'GET') {
        var timestamp = (new Date()).getTime();
        var separator = url.indexOf('?') > -1 ? '&' : '?';
        url += separator + '_el=' + timestamp;
    }

    return url;
};

var unsupportedDbOperators = [
    '$geoWithin',
    '$geoIntersects',
    '$near',
    '$within',
    '$nearSphere'
];

utils.getUnsupportedOperators = function (filter) {
    var dbOperators = utils.getDbOperators(filter);
    return _.intersection(dbOperators, unsupportedDbOperators);
};

// http://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
utils.isGuid = function (str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

utils.isQuerySupportedOffline = function (query) {
    var queryParams = query.getQueryParameters();
    var hasExpandExpression = !_.isEmptyObject(queryParams.expand);
    var unsupportedOperators = utils.getUnsupportedOperators(queryParams.filter);
    var hasUnsupportedOperators = unsupportedOperators.length !== 0;
    var isUnsupportedInOffline = hasExpandExpression || hasUnsupportedOperators;
    return !isUnsupportedInOffline;
};

// http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript/16245768#16245768
utils.b64toBlob = function (b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
};

// http://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
utils.arrayBufferToBase64 = function (buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
};

utils.successfulPromise = function (data) {
    return new rsvp.Promise(function (resolve) {
        resolve(data);
    });
};

utils.rejectedPromise = function (err) {
    return new rsvp.Promise(function (resolve, reject) {
        reject(err);
    });
};

utils.transformPlatformPath = function transformPlatformPath(platformPath) {
    if (!platformPath) {
        return '';
    }

    if (platform.isWindowsPhone) {
        if (platformPath.charAt(0) === '/' && platformPath.charAt(1) !== '/') {
            platformPath = '/' + platformPath;
        }
    } else { //TODO: probably desktop too
        if (platformPath.indexOf('file:/') !== -1 && platformPath.indexOf('file:///') === -1) {
            platformPath = platformPath.replace('file:/', 'file:///');
        }
    }

    return platformPath;
};

utils._stringCompare = function (string, check) {
    return string.toLowerCase() === check;
};

utils.isContentType = {
    files: function (collectionName) {
        return utils._stringCompare(collectionName, 'files');
    },
    users: function (collectionName) {
        return utils._stringCompare(collectionName, 'users');
    }
};

utils.isElement = {
    _isElement: function (el, check) {
        var tag = el;

        if (typeof tag !== 'string') {
            if (el instanceof HTMLElement) {
                tag = el.tagName;
            }
        }

        return utils._stringCompare(tag, check);
    },
    image: function (el) {
        return utils.isElement._isElement(el, 'img');
    },
    anchor: function (el) {
        return utils.isElement._isElement(el, 'a');
    }
};

utils.joinPath = function joinPath() {
    var args = [].slice.apply(arguments).map(function (arg) {
        return arg || '';
    });

    var joinedPath = path.join.apply(path, args);
    return utils.transformPlatformPath(joinedPath);
};

utils.uuid = function () {
    //http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

    return uuid;
};

utils.getId = function (obj) {
    return obj.Id || obj._id || obj.id;
};

utils.lazyRequire = function (moduleName, exportName) {
    exportName = exportName || moduleName;
    var obj = {};

    Object.defineProperty(obj, exportName, {
        get: function () {
            return require(moduleName);
        }
    });

    return obj;
};

module.exports = utils;
