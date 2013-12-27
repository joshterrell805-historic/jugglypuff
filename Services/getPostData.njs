/*
 * Get POST data as an associative array
 * an empty array signifies no data
 *
 * (internal) limiting POST data size is handled by this function.
 * In the case that the user sent more data then the limit, send them
 * an error and don't pass control back to the caller.
 */

// TODO: ADD TESTS!! max data exceeeded? no data? data format?

var POST_DATA_MAX_BYTES = 50000;
var querystring = require('querystring');

module.exports = function getPostData(nodeRequest, callback) {

   var body = '';

   nodeRequest.on('data', function(data) {

      body += data;

      if (body.length >= POST_DATA_MAX_BYTES) {
         nodeRequest.connection.destroy();
      }

   });

   nodeRequest.on('end', function() {
      callback(null, querystring.parse(body));
   });

}
