
var fs = require('fs');

/*
 * Return the data to the responder or throw an error if one occurred
 */

module.exports = function readFile(filename, callback) {
   fs.readFile(filename, {encoding: 'utf8'}, callback);
}
