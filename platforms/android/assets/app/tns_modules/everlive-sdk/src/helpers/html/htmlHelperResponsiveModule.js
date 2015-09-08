'use strict';

var common = require('../../common');
var _ = common._;
var rsvp = common.rsvp;
var EverliveError = require('../../EverliveError').EverliveError;
var constants = require('../../constants');
var utils = require('../../utils');

module.exports = (function () {
    function HtmlHelperResponsiveModule(htmlHelper) {
        this.htmlHelper = htmlHelper;
    }

    HtmlHelperResponsiveModule.prototype = {
        getBackgroundWidth: function getBackgroundWidth(el) {
            return Math.ceil(el.offsetWidth);
        },

        parseParamsString: function parseParamsString(str) {
            if (!str || typeof str === 'undefined' || str.length <= 1) {
                return false;
            }

            var isUserResize = false;
            var params = [];
            var tmp = str.split('/');
            var ii = tmp.length;

            for (var i = 0; i < ii; i++) {
                var item = tmp[i].split('='),
                    tmpObj = {};
                if (typeof item[1] === 'undefined') {
                    item[1] = false;
                } else {
                    item[1] = unescape(item[1].replace(/\+/g, ' '));
                }

                tmpObj[item[0]] = item[1];
                params.push(tmpObj);
                if (item[0] === 'resize') {
                    isUserResize = true;
                }
            }
            return {
                params: params,
                isUserResize: isUserResize
            };
        },

        getImgParams: function getImgParams(src) {
            var operations;
            var imgUrl = src.replace(/.*?resize=[^//]*\//gi, '');
            var protocolRe = new RegExp('https?://', 'gi');
            var serverRe = new RegExp(this.htmlHelper._settings.server, 'gi');
            var apiKeyRe = new RegExp(this.htmlHelper._everlive.apiKey + '/', 'gi');

            operations = src.replace(imgUrl, '').replace(protocolRe, '').replace(serverRe, '').replace(apiKeyRe, '').toLowerCase();
            if (operations !== '') {
                operations = operations.indexOf('/') ? operations.substring(0, operations.length - 1) : operations;
            } else {
                operations = false;
            }

            operations = this.parseParamsString(operations);
            // If it's a user resize operation, use the passed url in the data-src property
            if (operations.isUserResize) {
                imgUrl = src;
            }

            return {
                imgUrl: imgUrl,
                operations: operations.params,
                isUserResize: operations.isUserResize
            };
        },

        hasClass: function hasClass(el, cl) {
            var regex = new RegExp('(?:\\s|^)' + cl + '(?:\\s|$)');
            return !!el.className.match(regex);
        },

        getImageWidth: function getImageWidth(el) {
            var parentEl = el.parentNode;
            var parentWidth = parentEl.offsetWidth;
            var itemStyle = window.getComputedStyle(parentEl, null);
            var pl = parseFloat(itemStyle.getPropertyValue('padding-left'));
            var pr = parseFloat(itemStyle.getPropertyValue('padding-right'));
            var bl = parseFloat(itemStyle.getPropertyValue('border-left-width'));
            var br = parseFloat(itemStyle.getPropertyValue('border-right-width'));

            return Math.abs(parentWidth - Math.ceil(pl + pr + bl + br));
        },

        getDevicePixelRatio: function getDevicePixelRatio() {
            return window.devicePixelRatio ? window.devicePixelRatio : 1;
        },

        getPixelRatio:function getPixelRatio(el) {
            var pixelDensity = el.getAttribute(this.htmlHelper.options.attributes.dpi) || '';
            return pixelDensity !== '' ? _.isNumber(pixelDensity) ? parseFloat(pixelDensity) : false : this.getDevicePixelRatio();
        },

        getImgParamsString: function getImgParamsString(image, params) {
            var paramsStr = '';
            var i = 0;
            var ii = params.length;
            for (; i < ii; i++) {
                var item = params[i];
                var key = _.keys(item)[0];
                var value;

                if (!utils.isElement.image(image) && key === 'resize') {
                    continue;
                }

                var pixelDensity = this.getPixelRatio(image.item);
                pixelDensity = (pixelDensity) ? ',pd:' + pixelDensity : '';
                for (var k in item) {
                    value = (key === 'resize') ? item[k] + pixelDensity : item[k];
                }

                paramsStr += key + '=' + value + '/';
            }

            return paramsStr;
        },

        responsiveImage: function responsiveImage(item, dataSrc) {
            var self = this;
            var image = _.extend({}, item);
            var element = image.item;
            var tag = image.tag;

            var isImage = utils.isElement.image(tag);
            var imgWidth;

            image = _.extend({}, image, self.getImgParams(dataSrc));

            if (!image.isUserResize) {
                imgWidth = (!isImage) ? self.getBackgroundWidth(element) : self.getImageWidth(element);
            }

            imgWidth = imgWidth ? imgWidth : false;
            var src = image.isUserResize ? image.imgUrl : self.getImgSrc(image, imgWidth);

            return new rsvp.Promise(function (resolve) {
                if (!imgWidth && !image.isUserResize) { // we don't have the width of the user image either.
                    // if this element is not visible, we don't have to process it.

                    return resolve();
                }

                return resolve(src);
            });
        },

        getImgSrc: function getImgSrc(image, imgWidth) {
            var protocol = this.htmlHelper._everlive.setup.scheme + '://';
            var apiKey = this.htmlHelper._everlive.setup.apiKey;
            var server = this.htmlHelper._settings.server;
            var url = this.htmlHelper._settings.urlTemplate;
            var pixelDensity = this.getPixelRatio(image.item);

            pixelDensity = pixelDensity ? ',pd:' + pixelDensity : '';

            url = url.replace('[protocol]', protocol);
            url = url.replace('[apikey]', apiKey ? apiKey : '');
            url = url.replace('[hostname]', server);

            var params = image.operations || false;
            if (params) {
                var operations = '';
                params = this.getImgParamsString(image, params);
                if (utils.isElement.image(image.tag)) {
                    operations = imgWidth ? 'resize=w:' + imgWidth + pixelDensity + '/' + params : params;
                } else {
                    operations = 'resize=w:' + imgWidth + pixelDensity + '/' + params;
                }
                url = url.replace('[operations]', operations);
            } else {
                url = url.replace('[operations]', 'resize=w:' + imgWidth + pixelDensity + '/');
            }

            url = url.replace('[url]', image.imgUrl);
            return url;
        }
    };

    return HtmlHelperResponsiveModule;
}());