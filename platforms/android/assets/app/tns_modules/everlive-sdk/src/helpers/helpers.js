'use strict';

/**
 * @class Helpers
 * @classdesc Everlive helper classes
 */

var platform = require('../everlive.platform');

var helpers = [];

var htmlHelper = require('./html/htmlHelper');

if (platform.isCordova || platform.isDesktop) {
    helpers.push({
        name: 'html',
        ctor: htmlHelper
    });
}

module.exports = helpers;