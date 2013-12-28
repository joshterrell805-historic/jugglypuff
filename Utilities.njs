
// TODO also with services, allow server implementor to choose utilities and
// services
module.exports = {
   getAbsolutePath: require('./Utilities/getAbsolutePath.njs'),
   htmlEncode: require('./Utilities/htmlEncode.njs'),
   log: require('./Utilities/log.njs'),
   parseAndValidateInput: require('./Utilities/parseAndValidateInput.njs')
}

