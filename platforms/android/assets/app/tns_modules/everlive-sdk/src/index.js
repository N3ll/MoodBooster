/*!
 The MIT License (MIT)
 Copyright (c) 2013 Telerik AD
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.y distributed under the MIT license.
 */
/*!
 Everlive SDK
 Version 1.5.4
 */
(function () {
    var Everlive = require('./Everlive');
    var platform = require('./everlive.platform');
    var common = require('./common');

    if (!platform.isNativeScript && !platform.isNodejs) {
        var kendo = require('./kendo/kendo.everlive');
        Everlive.createDataSource = kendo.createDataSource;
        Everlive.createHierarchicalDataSource = kendo.createHierarchicalDataSource;
    }

    //Global event handlers for push notification events. Required by the cordova PushNotifications plugin that we use.
    Everlive.PushCallbacks = {};
    Everlive.Offline = {};

    Everlive.Query = require('./query/Query');
    Everlive.QueryBuilder = require('./query/QueryBuilder');
    Everlive.GeoPoint = require('./GeoPoint');
    Everlive.Constants = require('./constants');
    Everlive.Request = require('./Request');
    Everlive.Data = require('./types/Data');
    Everlive._utils = require('./utils');
    Everlive._traverseAndRevive = Everlive._utils.parseUtilities.traverseAndRevive;
    Everlive._common = require('./common');

    var persistersModule = require('./offline/offlinePersisters');
    Everlive.persister = {
        LocalStorage: persistersModule.LocalStoragePersister,
        FileSystem: persistersModule.FileSystemPersister
    };

    module.exports = Everlive;
}());