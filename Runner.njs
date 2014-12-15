module.exports = Runner;

var url = require('url'),
    debug = require('debug')('jugglypuff:Runner');

function Runner(server, req, res) {
  this.server = server;
  this.req = req;
  this.res = res;
}

// Try to resond to the request. Should only be called once per runner.
Runner.prototype.run = function run() {
  var parsedUrl = url.parse(this.req.url);
  var pathname = parsedUrl.pathname;
  debug('%s %s', this.req.method, pathname);
  this.responderModule = this.loadResponderModule(pathname);

  if (this.responderModule === null) {
    debug('no responder found');
    this.res.writeHead('404');
    this.res.end('Error (404): Page Not Found');
  } else {
    debug('found responder');
    this.responder = new this.responderModule(this.req, this.res);
    this.responder.run();
  }
};

/**
 * Load the appropriate responder module given a relative pathname from the
 *  document root.
 *
 * @return: the appropriate module (may be catchAll) or null if none were found.
 */
Runner.prototype.loadResponderModule = function loadResponderModule(pathname) {
  if (pathname.endsWith('/')) {
    pathname += this.server.options.indexResponder;
  }

  var module = this.tryLoadModule(pathname);

  // 'catchAllResponder'?
  if (!module) {
    var index = pathname.lastIndexOf('/');
    pathname = pathname.substr(0, index + 1) +
        this.server.options.catchAllResponder;
    module = this.tryLoadModule(pathname);

    // 'catchAllAllResponder'?
    if (!module) {
      pathname =  '/' + this.server.options.catchAllAllResponder;
      module = this.tryLoadModule(pathname);
    }
  }

  return module;
};

/**
 * Try loading a module by the requested pathname.
 *
 * @return module or null
 */
Runner.prototype.tryLoadModule = function tryLoadModule(pathname) {
  var pathname = this.server.options.responderRoot + pathname +
      this.server.options.responderExtension
  try {
    debug('try load %s', pathname);
    var module = require(pathname);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND' && e.message.endsWith(pathname + "'")) {
      module = null;
    } else {
      throw e;
    }
  }
  return module;
};
