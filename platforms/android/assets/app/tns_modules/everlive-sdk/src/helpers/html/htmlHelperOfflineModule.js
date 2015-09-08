'use strict';

var utils = require('../../utils');
var EverliveErrorModule = require('../../EverliveError');
var EverliveErrors = EverliveErrorModule.EverliveErrors;
var EverliveError = EverliveErrorModule.EverliveError;
var constants = require('../../constants');
var path = require('path');
var common = require('../../common');
var _ = common._;

module.exports = (function () {
    function HtmlHelperOfflineModule(htmlHelper) {
        this.htmlHelper = htmlHelper;
    }

    HtmlHelperOfflineModule.prototype = {
        processOffline: function (url) {
            var self = this;

            if (!self.htmlHelper._everlive.offlineStorage.files) {
                return utils.rejectedPromise(new EverliveError('Offline storage must be enabled in order to use the offline features of the images component.'));
            }

            return self.htmlHelper._everlive.offlineStorage.files.downloadOffline(url)
                .then(function (localUrl) {
                    return localUrl;
                })
                .catch(function (err) {
                    if (err.code !== EverliveErrors.cannotDownloadOffline.code) {
                        throw err;
                    }

                    return self.htmlHelper._everlive.offlineStorage._offlineFilesProcessor
                        .getOfflineFilesData()
                        .then(function (offlineFilesData) {
                            var basename = path.basename(url);
                            var oldFile = _.find(offlineFilesData, function (entry) {
                                if (entry.onlineLocation && entry.offlineLocation) {
                                    var onlineLocation = entry.onlineLocation;
                                    var basenameIndex = onlineLocation.lastIndexOf(basename);
                                    return basenameIndex !== -1;
                                }
                            });

                            if (oldFile) {
                                return oldFile.offlineLocation;
                            }

                            throw new EverliveError('Cannot find offline image ' + url, EverliveErrors.missingOrInvalidFileContent.code);
                        });
                });
        }
    };

    return HtmlHelperOfflineModule;
}());