var Processor = require('./common').Processor;
var DataQuery = require('./query/DataQuery');
var Query = require('./query/Query');
var EverliveError = require('./EverliveError').EverliveError;
var constants = require('./constants');

module.exports = (function () {
    return new Processor({
        executionNodeFunction: function (node, expandContext, done) {
            var targetTypeName = node.targetTypeName.toLowerCase() === constants.FilesTypeNameLegacy ? constants.FilesTypeName : node.targetTypeName;

            var query = new DataQuery({
                operation: DataQuery.operations.read,
                collectionName: targetTypeName,
                filter: new Query(node.filter, node.select, node.sort, node.skip, node.take)
            });

            expandContext.offlineModule.processQuery(query).then(function (data) {
                done(null, data.result);
            }, done);
        }
    });
}());
