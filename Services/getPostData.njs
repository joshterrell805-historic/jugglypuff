/*
 * Get POST data as an associative array
 * an empty array signifies no data
 *
 * (internal) limiting POST data size is handled by this function.
 * In the case that the user sent more data then the limit, send them
 * an error and don't pass control back to the responder.
 */

// TODO: ADD TESTS!! max data exceeeded? no data? data format?

var POST_DATA_MAX_BYTES = 50000;
var querystring = require('querystring');

module.exports = function getPostData(response) {

   var body = '';

   response.nodeRequest.on('data', function(data) {

      body += data;

      if (body.length >= POST_DATA_MAX_BYTES) {
         //TODO: also reply to the client saying they sent too much data?
         response.connection.destroy();
      }

   });

   response.nodeRequest.on('end', function() {
      response.asyncCallback(null, querystring.parse(body));
   });

}
