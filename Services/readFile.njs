
var fs = require('fs');

/*
 * Return the data to the responder or throw an error if one occurred
 */

module.exports = function readFile(response, filename) {
   fs.readFile(filename, {encoding: 'utf8'}, 
    response.asyncCallback.bind(response));
}