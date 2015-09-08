module.exports = (function () {
    var common = {};
    var dependencyStore = {};

    var platform = require('./everlive.platform');
    var isNativeScript = platform.isNativeScript;
    var isNodejs = platform.isNodejs;

    if (!isNodejs && !isNativeScript) {
        dependencyStore.reqwest = require('reqwest');
    } else if (isNativeScript) {
        common.root = global;
        dependencyStore.reqwest = require('./reqwest.nativescript');
    } else if (isNodejs) {
        common.root = global;
        dependencyStore.reqwest = require('./reqwest.nodejs');
    }

    if (!common.root) {
        //browser/requirejs/cordova
        common.root = window;
    }

    var exportDependency = function exportDependency(globalName, localName) {
        if (!localName) {
            localName = globalName;
        }

        //for the everlive bundle without dependencies included, browserify replaces them with empty objects
        //we need to make sure that these dependencies are marked as undefined
        if (dependencyStore[localName] &&
            typeof dependencyStore[localName] === 'object' && !Object.keys(dependencyStore[localName]).length) {

            dependencyStore[localName] = undefined;
        }

        Object.defineProperty(common, localName, {
            get: function () {
                return dependencyStore[localName] || this.root[globalName];
            }
        });
    };

    dependencyStore._ = require('underscore');
    exportDependency('_');

    dependencyStore.jstz = require('jstimezonedetect').jstz;
    exportDependency('jstz');

    dependencyStore.mongoQuery = require('mongo-query');
    exportDependency('mongoQuery');

    dependencyStore.Mingo = require('mingo');
    exportDependency('Mingo');

    dependencyStore.Processor = require('../scripts/bs-expand-processor');
    exportDependency('Processor');

    dependencyStore.rsvp = require('rsvp');
    exportDependency('RSVP', 'rsvp');

    exportDependency('reqwest');

    dependencyStore.jsonStringify = require('json-stable-stringify');
    exportDependency('json-stable-stringify', 'jsonStringify');

    return common;
}());