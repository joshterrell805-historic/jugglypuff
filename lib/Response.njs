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
   if (pathname.startsWith('/')) {
      pathname = pathname.substr(1);
   }
   if (pathname.length === 0 || pathname.endsWith('/')) {
      pathname += server.options.indexResponder;
   }

   this.responderModule = this._loadModule(pathname);

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

Response.prototype._loadModule = function _loadModule(pathname) {
   try {
      // Try to find the responder the user asked for.
      var module = this._tryLoadModule(pathname);
   } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
         // What about the 'catchAllResponder'?
         var index = pathname.lastIndexOf('/');
         if (index === -1) {
            pathname = this.server.options.catchAllResponder;
         } else {
            pathname = pathname.substr(0, index + 1)
             + this.server.options.catchAllResponder;
         }
         try {
            var module = this._tryLoadModule(pathname);
         } catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
               // What about the 'catchAllAllResponder'?
               pathname = this.server.options.catchAllAllResponder;
               try {
                  var module = this._tryLoadModule(pathname);
               } catch (e) {
                  if (e.code === 'MODULE_NOT_FOUND') {
                     var module = null;
                  } else {
                     throw e;
                  }
               }
            } else {
               throw e;
            }
         }
      } else {
         throw e;
      }
   }

   return module;
}

Response.prototype._tryLoadModule = function _tryLoadModule(pathname) {
   var pathname = this.server.options.documentRoot + pathname +
    this.server.options.responderExtension
   debug('try load %s', pathname);
   return require(pathname);
}
