/*
 * encode/escape html to be inserted into the body of a page
 *
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

module.exports = htmlEncode;

function htmlEncode(str) {
   if (!str)
      return '';

   return str.replace(/&/g, '&amp;')
             .replace(/>/g, '&gt;')
             .replace(/</g, '&lt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#39;')
             .replace(/\//g, '&#47;')
   ;
}
