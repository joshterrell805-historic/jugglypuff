
module.exports = {
   getAbsolutePath: getAbsolutePath
}

/*
 * Get the absolutePath from the calling code's __filename and filename
 *
 * EX:
 *    __filename = '/var/www/server/content/MyModule.njs
 *    filename = '../shared/Utilities.njs'
 *    return = '/var/www/server/content/../shared/Utilities.njs'
 */

var fileInDir = /\/([^\/]*)$/;

function getAbsolutePath(__filename, filename) {
    return __filename.substr(0, __filename.length -
     fileInDir.exec(__filename)[1].length) + filename;
}
