module.exports = {
   Server: Server,
   Response: require('./lib/Response.njs'),
   Responder: require('./lib/Responder.njs'),
};

var _ = require('underscore'),
    http = require('http'),
    debug = require('debug')('jugglypuff:server');

/**
 * Create a new server object using the specified options.
 *
 * Options:
 *    port: the port to listen to requests on. default=80
 *    documentRoot: the documentRoot to find responders at.
 *     defaults to the directory the application was executed from (PWD)
 *    hostname: see nodejs.org http#server.listen
 *    backlog: see nodejs.org http#server.listen
 *    catchAllResponder: The filename of the responder (without extension)
 *     to use in case the appropriate responder can't be found. Useful for
 *     making an entire directory served by one responder or for 404ing
 *     depending on location.
 *     For this responder and index, the current directory is searched for
 *     the appropriate file and if none is found catchAllAll is displayed.
 *    indexResponder: The filename of the responder (without extension)
 *     to be used in the case that a path ending with a '/' is requested.
 *    catchAllAllResponder: a file looked for in the document root to be served
 *     up when the responder doesn't exist and the catchAllResponder doesn't
 *     exist. If this file isn't found an ugly textual '404' is displayed.
 */
function Server(options) {
   var defaults = {
      backlog: undefined,
      documentRoot: process.env.PWD,
      hostname: undefined,
      port: 80,
      responderExtension: '.njs',
      catchAllResponder: '_',
      indexResponder: 'index',
      catchAllAllResponder: '404',
      responseModule: module.exports.Response,
   };

   this.options = _.defaults(options, defaults);

   var root = this.options.documentRoot;
   if (!root.endsWith('/')) {
      this.options.documentRoot += '/';
   }
}

/**
 * Start listening for requests.
 *
 * callback (optional): callback called with `this` when the server has
 *  successfully started.
 *
 * Return: a promise that resolves when the server is listening or has failed to
 *  listen.
 */
Server.prototype.start = function start(callback) {
   var options = this.options;
   var httpServer = this.httpServer =
    http.createServer(this._onRequest.bind(this));

   httpServer.once('listening', function() {
      var hostname = options.hostname ? options.hostname : '*';
      debug('listening on %s:%s', hostname, options.port);
      debug('documentRoot: %s', options.documentRoot);
      this.running = true;
      callback && callback(this);
   }.bind(this));

   process.on('SIGINT', function() {
      debug('SIGINT');
      if (this.running) {
         this.stop();
      }
   }.bind(this));

   debug('starting...');
   httpServer.listen(options.port, options.hostname, options.backlog);
};

/**
 * Alias for Server#start
 */
Server.prototype.listen = Server.prototype.start;

/**
 * Stop the server. 
 *
 * callback (optional): callback called with `this` when the server has
 * successfully stopped.
 */
Server.prototype.stop = function stop(callback) {
   debug('stopping...');
   this.httpServer.close(function() {
      var hostname = this.options.hostname ? this.options.hostname : '*';
      var port = this.options.port;
      debug('stopped %s:%s', hostname, port);
      this.running = false;
      callback && callback(this);
   }.bind(this));
};

Server.prototype._onRequest = function(req, res) {
   new this.options.responseModule(this, req, res);
};
