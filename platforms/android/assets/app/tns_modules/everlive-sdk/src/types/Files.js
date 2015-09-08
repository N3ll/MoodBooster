/**
 * @class Files
 * @protected
 * @extends Data
 */

var buildPromise = require('../utils').buildPromise;
var DataQuery = require('../query/DataQuery');
var Request = require('../Request');
var utils = require('../utils');

module.exports.addFilesFunctions = function addFilesFunctions(ns) {
    /**
     * Get a URL that can be used as an endpoint for uploading a file. It is specific to each {{site.TelerikBackendServices}} app.
     * @memberof Files.prototype
     * @method getUploadUrl
     * @returns {string}
     */
    ns.getUploadUrl = function () {
        return utils.buildUrl(this.setup) + this.collectionName;
    };

    /**
     * Get the download URL for a file.
     * @memberof Files.prototype
     * @method getDownloadUrl
     * @deprecated
     * @see {@link Files.getDownloadUrlById}
     * @param {string} fileId The ID of the file.
     * @returns {string} url The download URL.
     */
    ns.getDownloadUrl = function (fileId) {
        return utils.buildUrl(this.setup) + this.collectionName + '/' + fileId + '/Download';
    };

    ns._getUpdateUrl = function (fileId) {
        return this.collectionName + '/' + fileId + '/Content';
    };

    /**
     * Get a URL that can be used as an endpoint for updating a file. It is specific to each {{site.TelerikBackendServices}} app.
     * @memberof Files.prototype
     * @method getUpdateUrl
     * @param {string} fileId The ID of the file.
     * @returns {string} url The update URL.
     */
    ns.getUpdateUrl = function (fileId) {
        return utils.buildUrl(this.setup) + this._getUpdateUrl(fileId);
    };

    /**
     * Updates a file's content
     * @memberof Files.prototype
     * @method updateContent
     * @param {string} fileId File ID.
     * @param {Object} file The file metadata and the base64 encoded file content.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     * @returns {Promise} The promise for the request
     */
    ns.updateContent = function (fileId, file, success, error) {
        var self = this;

        return buildPromise(function (success, error) {
            var dataQuery = new DataQuery({
                operation: DataQuery.operations.filesUpdateContent,
                // the passed file content is base64 encoded
                data: file,
                collectionName: self.collectionName,
                additionalOptions: {
                    id: fileId
                },
                onSuccess: success,
                onError: error
            });


            return self.processDataQuery(dataQuery);
        }, success, error);
    };

    /**
     * Gets the download URL for a file by ID.
     * @memberof Files.prototype
     * @method getDownloadUrlById
     * @param {string} fileId File ID.
     * @returns {Promise} The promise for the request
     */
    /**
     * Gets the download URL for a file by ID.
     * @memberof Files.prototype
     * @method getDownloadUrlById
     * @param {string} fileId File ID.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.getDownloadUrlById = function (fileId, success, error) {
        var self = this;

        return buildPromise(function (success, error) {
            var dataQuery = new DataQuery({
                operation: DataQuery.operations.filesGetDownloadUrlById,
                collectionName: self.collectionName,
                additionalOptions: {
                    id: fileId
                },
                parse: Request.parsers.single,
                onSuccess: function (data) {
                    success(data.result.Uri);
                },
                onError: error
            });


            return self.processDataQuery(dataQuery);
        }, success, error);
    };

    ns.download = function (url, localPath, options, trustAllHosts, success, error) {
        return buildPromise(function (success, error) {
            if (!trustAllHosts) {
                trustAllHosts = false;
            }

            var fileTransfer = new FileTransfer();
            fileTransfer.download(url, localPath, success, error, trustAllHosts, options);
        }, success, error);
    };

    ns.upload = function (localPath, url, options, trustAllHosts, success, error) {
        return buildPromise(function (success, error) {
            if (!trustAllHosts) {
                trustAllHosts = false;
            }
            var fileTransfer = new FileTransfer();
            var uri = encodeURI(url);
            fileTransfer.upload(localPath, uri, success, error, options, trustAllHosts);
        }, success, error);
    }
};