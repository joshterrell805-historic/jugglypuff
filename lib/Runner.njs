module.exports = Runner;

var url = require('url'),
    debug = require('debug')('jugglypuff:runner');

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
      res.writeHead('404');
      res.end('Error (404): Page Not Found');
   } else {
      debug('found responder');
      this.responder = new this.responderModule(this);
      this.responder.respond(this.req.method);
   }
};

/**
 * Load the appropriate responder module given a relative pathname from the
 *  document root.
 * Return: the appropriate module (may be catchAll) or null if none were found.
 */
Runner.prototype.loadResponderModule =
 function loadResponderModule(pathname) {
   if (pathname.startsWith('/')) {
      pathname = pathname.substr(1);
   }
   // Alter pathname to index responder if ends in '/'
   if (pathname.length === 0 || pathname.endsWith('/')) {
      pathname += this.server.options.indexResponder;
   }

   var module = this._tryLoadModule(pathname);

   // What about the 'catchAllResponder'?
   if (!module) {
      var index = pathname.lastIndexOf('/');
      if (index === -1) {
         pathname = this.server.options.catchAllResponder;
      } else {
         pathname = pathname.substr(0, index + 1)
          + this.server.options.catchAllResponder;
      }
      module = this._tryLoadModule(pathname);
   }

   // What about the 'catchAllAllResponder'?
   if (!module) {
      pathname = this.server.options.catchAllAllResponder;
      module = this._tryLoadModule(pathname);
   }

   return module;
}

Runner.prototype._tryLoadModule = function _tryLoadModule(pathname) {
   var pathname = this.server.options.documentRoot + pathname +
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
}
