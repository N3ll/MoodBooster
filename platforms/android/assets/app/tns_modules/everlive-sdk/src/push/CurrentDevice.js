var platform = require('../everlive.platform');
var _ = require('../common')._;

'use strict';

if (platform.isNativeScript) {
	var NativeScriptCurrentDevice = require('./NativeScriptCurrentDevice');
    module.exports = NativeScriptCurrentDevice;
} else if (platform.isCordova || platform.isDesktop) {
	var CordovaCurrentDevice = require('./CordovaCurrentDevice');
    module.exports = CordovaCurrentDevice;
} else {
    module.exports = _.noop;
}