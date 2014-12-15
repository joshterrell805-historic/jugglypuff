module.exports = {
  Server: Server,
  Runner: require('./Runner.njs'),
  Responder: require('./Responder.njs'),
};

var _ = require('underscore'),
    http = require('http'),
    debug = require('debug')('jugglypuff:Server'),
    EventEmitter = require('events').EventEmitter,
    Promise = require('promise');

/**
 * Create a new server object using the specified options.
 *
 * Options:
 *   port: the port to listen to requests on. default=80
 *   responderRoot: the absolute root directory to find responders at.
 *     defaults to the directory the working directory (PWD)
 *   hostname: see nodejs.org http#server.listen
 *   backlog: see nodejs.org http#server.listen
 *   catchAllResponder: the relative filename of the responder to use in case
 *     an exact responder doesn't match the requested pathname. Relative to
 *     directory of requested path (/dir/catchAll serves /dir/* only,
 *     not /dir/asdf/*).
 *   indexResponder: the filename of the responder to be used in the case
 *     that a path ending with a '/' is requested.
 *   catchAllAllResponder: the pathname (relative to responderRoot) of the 
 *     responder to be used when a requested pathname hasn't been matched
 *     by any other means.
 *   responderExtension: extension to append to all requests when loading
 *     module.
 *   
 * order of lookup:
 *   exact match, index (if ends in /), catchAll, catchAllAll
 *
 * events:
 *   stop - Fires when the server is being stopped.
 *          This server overrides default SIGINT so you need to close
 *            all custom open services using this event.
 *   request(req, res) - Fires when a new request comes in.
 */
function Server(options) {
  var defaults = {
    port: 80,
    responderRoot: process.env.PWD,
    hostname: undefined,
    backlog: undefined,
    catchAllResponder: '_',
    responderExtension: '.njs',
    indexResponder: 'index',
    catchAllAllResponder: '404',
    runnerModule: module.exports.Runner,
  };

  this.options = _.defaults({}, options, defaults);

  var root = this.options.responderRoot;
  if (root[root.length-1] ==='/') {
    this.options.responderRoot = root.substr(0, root.length - 1);
  }
}

Server.prototype = Object.create(EventEmitter.prototype);

/**
 * Start listening for requests.
 *
 * @fires request on new requests
 * @resolve when the server has started listening
 */
Server.prototype.start = function start() {
  this.on('request', this.handleRequest.bind(this));
  return new Promise(function(resolve, reject) {
    var options = this.options;
    var fireRequest = function fireRequest(req, res) {
      this.emit('request', req, res);
    }.bind(this);

    var httpServer = this.httpServer = http.createServer(fireRequest);

    httpServer.once('listening', function() {
      var hostname = options.hostname ? options.hostname : '*';
      debug('listening on %s:%s', hostname, options.port);
      debug('responderRoot: %s', options.responderRoot);
      this.running = true;
      resolve(this);
    }.bind(this));

    process.on('SIGINT', function() {
      debug('SIGINT');
      if (this.running) {
        this.stop();
      }
    }.bind(this));

    debug('starting...');
    httpServer.listen(options.port, options.hostname, options.backlog);
  }.bind(this));
};

/**
 * Stop the server. 
 * @fires stop
 */
Server.prototype.stop = function stop() {
  debug('stopping...');
  this.httpServer.close(function() {
    var hostname = this.options.hostname ? this.options.hostname : '*';
    var port = this.options.port;
    debug('stopped %s:%s', hostname, port);
    this.running = false;
    this.emit('stop');
  }.bind(this));
};

Server.prototype.handleRequest = function handleRequest(req, res) {
  var runner = new this.options.runnerModule(this, req, res);
  runner.run();
};
