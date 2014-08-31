module.exports = Response;

var url = require('url'),
    debug = require('debug')('jugglypuff:response');

function Response(server, nodeReq, nodeRes) {
   this.server = server;
   this.nodeReq = nodeReq;
   this.nodeRes = nodeRes;

   var reqUrl = url.parse(nodeReq.url);

   var pathname = reqUrl.pathname;
   debug('%s %s', nodeReq.method, pathname);
   this.responderModule = this.loadResponderModule(pathname);

   if (this.responderModule === null) {
      debug('no responder found');
      nodeRes.writeHead('404');
      nodeRes.end('Error (404): Page Not Found');
   } else {
      // TODO document architecture of responders.
      // The responder is a class.
      debug('found responder');
      this.responder = new this.responderModule(this);
      this.responder.respond(nodeReq.method);
   }
}

/**
 * Load the appropriate responder module given a relative pathname from the
 *  document root.
 * Return: the appropriate module (may be catchAll) or null if none were found.
 */
Response.prototype.loadResponderModule =
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

Response.prototype._tryLoadModule = function _tryLoadModule(pathname) {
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
