/*
 * TODO:
 * Make syntax checker.
 * Add complete tests.
 * Responder testing framework?
 * Be able to send signals to the server to reload certain modules, services,
 *  and utilities.
 */

var server;

module.exports = {

   start: function(port, documentRoot) {

      var http = require('http');
      var Response = require('./Response.njs')(documentRoot);

      server = http.createServer(function(req, res) {
         new Response(req, res);
      });

      server.listen(port);

      return server;
   },
   kill: function(callback) {
      server.close(function() {
         if (callback)
            callback();
         process.exit(0);
      });
   }
};

process.on('SIGINT', function() {
   module.exports.kill();
});
