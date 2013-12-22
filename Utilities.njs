
module.exports = {
   getAbsolutePath: getAbsolutePath,
   htmlEncode: htmlEncode
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

/*
 * This function is not safe for using in certain circumstances.
 * This function is ONLY safe to use if the text to be encoded goes into
 *  a normal html tag or a QUOTED (single or double) attribute value.
 * This function is not safe in certain attributes such as src and href.
 *
 * safe: '<div>' + htmlEncode(userString) + '</div>'
 * safe: '<p id "' + htmlEncode(userString) + '"></p>'
 * unsafe: '<script>' + htmlEncode(userString) + '</script>'
 *
 * https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet
 *
 */
function htmlEncode(str) {
   return str.replace('&', '&amp;')
             .replace('>', '&gt;')
             .replace('<', '&lt;')
             .replace('"', '&quot;')
             .replace("'", '&#39;')
             .replace('/', '&#47;')
   ;
}
