'use strict';
var async = require('async');
var RelationTreeBuilder = require('./RelationTreeBuilder');
var ExecutionTree = require('./ExecutionTree');
var Constants = require('./Constants');
var ExpandError = require('./ExpandError');

function Processor(options) {
    this._executionNodeFunction = options.executionNodeFunction;
    this._metadataProviderFunction = options.metadataProviderFunction;
}

Processor.prototype._getExecutionTreeRoot = function (executionTree) {
    var executionTreeRoot = null;
    for (var exNode in executionTree) {
        if (executionTree.hasOwnProperty(exNode)) {
            if (executionTree[exNode].parent === '') {
                executionTreeRoot = executionTree[exNode];
                break;
            }
        }
    }
    return executionTreeRoot;
};

Processor.prototype._createExecuteNodeExecutor = function (relationsTree, executionTree, executionNode, expandContext) {
    var self = this;
    var relationsTreeMap = relationsTree.map;
    return function (done) {
        var relationNode = executionTree.getRelationNode(executionNode.relations[0]);//get the relation node for the only relation of the execution node.
        var parentRelationNode = executionTree.getRelationNode(relationNode.parent);
        var includeArrays = !(parentRelationNode.parent && parentRelationNode.hasArrayValues); //only expand array fields if the parent relation is not an array. This means that if we have expanded a Likes (multiple to Users), we won't expand any array relations that are nested in it such as the UserComments (multiple relation to Comments).
        var filter = executionTree.getFilterFromExecutionNode(executionNode, includeArrays);

        var errorMessage = relationsTree.validateSingleRelation(relationNode);
        if (errorMessage) {
            return done(new ExpandError(errorMessage));
        }

        // if we have such options executionNode should have only one relation.
        var node = {};
        node.select = relationNode.fieldsExpression;
        node.sort = relationNode.sortExpression;
        node.skip = relationNode.skip;
        node.take = relationNode.take;
        node.filter = filter;
        node.targetTypeName = relationNode.targetTypeName;

        self._executionNodeFunction.call(null, node, expandContext, function onProcessExecutionNode(err, result) {
            if (err) {
                return done(err);
            }

            for (var i = 0; i < executionNode.relations.length; i++) {
                var childRelation = relationsTreeMap[executionNode.relations[i]];
                childRelation.result = self._extractResultForRelation(relationsTreeMap[executionNode.relations[i]], result);
            }
            executionNode.result = childRelation.result;
            var arr = [];
            for (var j = 0; j < executionNode.children.length; j++) {
                var executionTreeMap = executionTree._map;
                arr.push(self._createExecuteNodeExecutor(relationsTree, executionTree, executionTreeMap[executionNode.children[j]], expandContext));
            }
            async.parallel(arr, done);
        });
    };
};

Processor.prototype._getSingleResult = function (relationsTree, relation, singleObject) {
    if (!singleObject) {
        return null;
    }

    var childRelation;
    var childItem;

    // if relation has singleFieldName option we just replace the parent id with a single value
    if (relation.singleFieldName) {
        if (relation.children && relation.children.length > 0) {
            childRelation = relationsTree[relation.children[0]];
            childItem = this._getObjectByIdFromArray(childRelation.result, singleObject[relation.singleFieldName]);
            return this._getSingleResult(relationsTree, childRelation, childItem);
        }
        return singleObject[relation.singleFieldName];
    }

    var result = {};
    var passedProperties = {};

    if (relation.children && relation.children.length > 0) {
        for (var j = 0; j < relation.children.length; j++) {
            childRelation = relationsTree[relation.children[j]];
            var childRelationField = childRelation.relationField;
            var userDefinedRelName = childRelation.userDefinedName;
            if (!childRelation.isInvertedRelation) {
                passedProperties[childRelationField] = 1;
            }

            var innerRelationResult = childRelation.result;

            if (childRelation.isInvertedRelation) {
                for (var k = 0; k < innerRelationResult.length; k++) {
                    this._addSingleResultToParentArray(relationsTree, childRelation, innerRelationResult[k], result, userDefinedRelName);
                }
            } else {
                result[userDefinedRelName] = childRelation.isArray() ? [] : null;

                if (singleObject[childRelationField]) {
                    if (Array.isArray(singleObject[childRelationField])) {
                        if (childRelation.sortExpression) {
                            // if there is a sorting we replace items using order of the query result
                            for (var p = 0; p < innerRelationResult.length; p++) {
                                if (singleObject[childRelationField].indexOf(innerRelationResult[p].Id) > -1) {
                                    childItem = innerRelationResult[p];
                                    this._addSingleResultToParentArray(relationsTree, childRelation, childItem, result, userDefinedRelName);
                                }
                            }
                        } else {
                            // we just replace items getting them by id which we have
                            for (var i = 0; i < singleObject[childRelationField].length; i++) {
                                childItem = this._getObjectByIdFromArray(innerRelationResult, singleObject[childRelationField][i]);
                                this._addSingleResultToParentArray(relationsTree, childRelation, childItem, result, userDefinedRelName);
                            }
                        }
                    } else {
                        childItem = this._getObjectByIdFromArray(innerRelationResult, singleObject[childRelationField]);
                        result[userDefinedRelName] = this._getSingleResult(relationsTree, childRelation, childItem);
                    }
                }
            }
        }
    }

    // add all other fields to the result (except the relation fields which we have already replaced).
    for (var prop in singleObject) {
        var propertyShouldBeAddedToResult = singleObject.hasOwnProperty(prop) && !passedProperties[prop] &&
            this._fieldExistInFieldsExpression(prop, relation.originalFieldsExpression);
        if (propertyShouldBeAddedToResult) {
            result[prop] = singleObject[prop];
        }
    }

    return result;
};

Processor.prototype._addSingleResultToParentArray = function (relationsTree, childRelation, childItem, result, userDefinedRelName) {
    var singleResult = this._getSingleResult(relationsTree, childRelation, childItem);
    result[userDefinedRelName] = result[userDefinedRelName] || [];
    if (singleResult) {
        result[userDefinedRelName].push(singleResult);
    }
};

/**
 * Checks if a field will be returned via given fields expression.
 * @param field - The name of the field.
 * @param fieldsExpression - The Fields expression which is checked.
 * @returns {*}
 */
Processor.prototype._fieldExistInFieldsExpression = function (field, fieldsExpression) {
    if (fieldsExpression === undefined || Object.keys(fieldsExpression).length === 0) {
        return true;
    }

    if (field === Constants.IdFieldNameClient) {
        if (fieldsExpression[field] === undefined) {
            return true;
        }
        return fieldsExpression[field];
    }

    var isExclusive = RelationTreeBuilder.getIsFieldsExpressionExclusive(fieldsExpression);

    if (isExclusive === undefined) {
        return true;
    }

    if (isExclusive) {
        return !fieldsExpression.hasOwnProperty(field);
    } else {
        return fieldsExpression.hasOwnProperty(field);
    }
};

/**
 * Extracts the result for a single relation (in cases when ExecutionNode contains more than one relations).
 * @param relation - The relation object.
 * @param queryResult - Result of the combined query.
 * @returns {Array}
 */
Processor.prototype._extractResultForRelation = function (relation, queryResult) {
    var result = [];
    for (var i = 0; i < queryResult.length; i++) {
        if (relation.parentRelationIds) {
            if (relation.parentRelationIds.hasOwnProperty(queryResult[i].Id)) {
                result.push(queryResult[i]);
            }
        }
        if (relation.isInvertedRelation) {
            result.push(queryResult[i]);
        }
    }
    return result;
};

/**
 * Gets an object with a given Id from Array.
 * @param array
 * @param id
 * @returns {*}
 */
Processor.prototype._getObjectByIdFromArray = function (array, id) {
    if (array) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].Id === id) {
                return array[i];
            }
        }
    }
    return null;
};

/**
 * @public
 * @param expandExpression
 * @param mainTypeName
 * @param isArray
 * @param fieldsExpression
 * @param maxTakeValue
 * @param prepareContext
 * @param done
 */
Processor.prototype.prepare = function (expandExpression, mainTypeName, isArray, fieldsExpression, maxTakeValue, prepareContext, done) {
    var rtb = new RelationTreeBuilder(expandExpression, mainTypeName, isArray, fieldsExpression, maxTakeValue, this._metadataProviderFunction, prepareContext);
    rtb.build(function (err, map) {
        var mainQueryFieldsExpression;
        if (map) {
            mainQueryFieldsExpression = map[map.$root].fieldsExpression;
            var prepareResult = {
                relationsTree: rtb,
                mainQueryFieldsExpression: mainQueryFieldsExpression
            }
        }
        done(err, prepareResult);
    });
};

/**
 * @public
 * @param relationsTree
 * @param mainQueryResult
 * @param expandContext
 * @param done
 */
Processor.prototype.expand = function (relationsTree, mainQueryResult, expandContext, done) {
    var relationsTreeMap = relationsTree.map;
    var self = this;
    var executionTree = new ExecutionTree(relationsTreeMap);
    executionTree.build();
    relationsTreeMap[relationsTreeMap.$root].result = mainQueryResult;
    var executionTreeMap = executionTree._map;

    var executionTreeRoot = this._getExecutionTreeRoot(executionTreeMap);

    var maxQueriesCount = 20;
    if (Object.keys(executionTreeMap).length > maxQueriesCount) {
        done(new ExpandError('Expand expression results in more than ' + maxQueriesCount + ' inner queries!'));
    }

    if (executionTreeRoot) {
        var execFuncs = [];
        for (var i = 0; i < executionTreeRoot.children.length; i++) {
            execFuncs.push(this._createExecuteNodeExecutor(relationsTree, executionTree, executionTreeMap[executionTreeRoot.children[i]], expandContext));
        }
        // execFuncs are functions created for every single execution note
        // we execute them in async, since the result of the parent relation is used to get correct filter.
        async.series(execFuncs, function onProcessExecutionTree(err) {
            if (err) {
                done(err);
            } else {
                var output;
                var rootRelation = relationsTreeMap[relationsTreeMap.$root];
                if (Array.isArray(mainQueryResult)) {
                    output = [];
                    for (var i = 0; i < mainQueryResult.length; i++) {
                        var singleResult = self._getSingleResult(relationsTreeMap, rootRelation, mainQueryResult[i]);
                        if (singleResult) {
                            output.push(singleResult);
                        }
                    }
                } else {
                    output = self._getSingleResult(relationsTreeMap, rootRelation, mainQueryResult);
                }
                done(null, output);
            }
        });
    }
};

Processor.Constants = Constants;

module.exports = Processor;
