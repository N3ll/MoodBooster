var _ = require('../common')._;

var deepExtend = require('./underscoreDeepExtends');
var compactObject = require('./underscoreCompactObject');
var isObjectEmpty = require('./underscoreIsObjectEmpty');

_.mixin({'deepExtend': deepExtend});
_.mixin({'compactObject': compactObject});
_.mixin({'isEmptyObject': isObjectEmpty});