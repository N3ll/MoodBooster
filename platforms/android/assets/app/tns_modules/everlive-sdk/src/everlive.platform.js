var isNativeScript = Boolean(((typeof android !== 'undefined' && android && android.widget && android.widget.Button)
|| (typeof UIButton !== 'undefined' && UIButton)));

var platform;
var isCordova = false;
var isWindowsPhone = false;
var isAndroid = false;

if (isNativeScript) {
    global.window = {
        localStorage: {
            removeItem: function () {
            } //shim for mongo-query under nativescript
        }
    };

} else if (typeof window !== 'undefined') {
    isCordova = /^file:\/{3}[^\/]|x-wmapp/i.test(window.location.href) && /ios|iphone|ipod|ipad|android|iemobile/i.test(navigator.userAgent);
    isWindowsPhone = isCordova && /iemobile/i.test(navigator.userAgent);
    isAndroid = isCordova && cordova.platformId === 'android';
}

var isNodejs = typeof exports === 'object' && typeof window === 'undefined';
var isRequirejs = typeof define === 'function' && define.amd;
var isDesktop = !isNativeScript && !isCordova && !isNodejs;

if (isNativeScript) {
    platform = 'ns';
} else if (isNodejs) {
    platform = 'nodejs';
} else if (isDesktop) {
    platform = 'desktop';
} else if (isCordova) {
    platform = 'cordova';
}

module.exports = {
    isCordova: isCordova,
    isNativeScript: isNativeScript,
    isDesktop: isDesktop,
    isWindowsPhone: isWindowsPhone,
    isAndroid: isAndroid,
    isNodejs: isNodejs,
    isRequirejs: isRequirejs,
    platform: platform
};