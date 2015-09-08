var platform = require('../everlive.platform');
var WebFileStore = require('./WebFileStore');
var NativeScriptFileStore = require('./NativeScriptFileStore');
var _ = require('../common')._;

'use strict';

if (platform.isNativeScript) {
    module.exports = NativeScriptFileStore;
} else if (platform.isCordova || platform.isDesktop) {
    module.exports = WebFileStore;
} else {
    module.exports = _.noop;
}