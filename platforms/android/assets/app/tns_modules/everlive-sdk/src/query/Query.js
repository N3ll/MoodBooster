var Expression = require('../Expression');
var OperatorType = require('../constants').OperatorType;
var WhereQuery = require('./WhereQuery');
var QueryBuilder = require('./QueryBuilder');

module.exports = (function () {
    /**
     * @class Query
     * @classdesc A query class used to describe a request that will be made to the {{site.TelerikBackendServices}} JavaScript API.
     * @param {object} [filter] A [filter expression]({% slug rest-api-querying-filtering %}) definition.
     * @param {object} [fields] A [fields expression]({% slug rest-api-querying-Subset-of-fields %}) definition.
     * @param {object} [sort] A [sort expression]({% slug rest-api-querying-sorting %}) definition.
     * @param {number} [skip] Number of items to skip. Used for paging.
     * @param {number} [take] Number of items to take. Used for paging.
     * @param {object} [expand] An [expand expression]({% slug features-data-relations-defining-expand %}) definition.
     */
    function Query(filter, fields, sort, skip, take, expand) {
        this.filter = filter;
        this.fields = fields;
        this.sort = sort;
        this.toskip = skip;
        this.totake = take;
        this.expandExpression = expand;
        this.expr = new Expression(OperatorType.query);
    }

    Query.prototype = {
        /** Applies a filter to the current query. This allows you to retrieve only a subset of the items based on various filtering criteria.
         * @memberOf Query.prototype
         * @method where
         * @name where
         * @param {object} filter A [filter expression]({% slug rest-api-querying-filtering %}) definition.
         * @returns {Query}
         */
        /** Defines a filter definition for the current query.
         * @memberOf Query.prototype
         * @method where
         * @name where
         * @returns {WhereQuery}
         */
        where: function (filter) {
            if (filter) {
                return this._simple(OperatorType.filter, [filter]);
            }
            else {
                return new WhereQuery(this);
            }
        },
        /** Applies a fields selection to the current query. This allows you to retrieve only a subset of all available item fields.
         * @memberOf Query.prototype
         * @method select
         * @param {object} fieldsExpression A [fields expression]({% slug rest-api-querying-Subset-of-fields %}) definition.
         * @returns {Query}
         */
        select: function () {
            return this._simple(OperatorType.select, arguments);
        },
        // TODO
        //exclude: function () {
        //    return this._simple(OperatorType.exclude, arguments);
        //},
        /** Sorts the items in the current query in ascending order by the specified field.
         * @memberOf Query.prototype
         * @method order
         * @param {string} field The field name to order by in ascending order.
         * @returns {Query}
         */
        order: function (field) {
            return this._simple(OperatorType.order, [field]);
        },
        /** Sorts the items in the current query in descending order by the specified field.
         * @memberOf Query.prototype
         * @method orderDesc
         * @param {string} field The field name to order by in descending order.
         * @returns {Query}
         */
        orderDesc: function (field) {
            return this._simple(OperatorType.order_desc, [field]);
        },
        /** Skips a certain number of items from the beginning before returning the rest of the items. Used for paging.
         * @memberOf Query.prototype
         * @method skip
         * @see [query.take]{@link query.take}
         * @param {number} value The number of items to skip.
         * @returns {Query}
         */
        skip: function (value) {
            return this._simple(OperatorType.skip, [value]);
        },
        /** Takes a specified number of items from the query result. Used for paging.
         * @memberOf Query.prototype
         * @method take
         * @see [query.skip]{@link query.skip}
         * @param {number} value The number of items to take.
         * @returns {Query}
         */
        take: function (value) {
            return this._simple(OperatorType.take, [value]);
        },
        /** Sets an expand expression for the current query. This allows you to retrieve complex data sets using a single query based on relations between data types.
         * @memberOf Query.prototype
         * @method expand
         * @param {object} expandExpression An [expand expression]({% slug features-data-relations-defining-expand %}) definition.
         * @returns {Query}
         */
        expand: function (expandExpression) {
            return this._simple(OperatorType.expand, [expandExpression]);
        },
        /** Builds an object containing the different expressions that will be sent to {{site.TelerikBackendServices}}. It basically translates any previously specified expressions into standard queries that {{site.bs}} can understand.
         * @memberOf Query.prototype
         * @method build
         * @returns {{$where,$select,$sort,$skip,$take,$expand}}
         */
        build: function () {
            return new QueryBuilder(this).build();
        },
        _simple: function (op, oprs) {
            var args = [].slice.call(oprs);
            this.expr.addOperand(new Expression(op, args));
            return this;
        }
    };

    return Query;
}());