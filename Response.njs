
var url = require('url');
var documentRoot;

module.exports = function(docRoot) {
   documentRoot = docRoot;
   return Response;
}

/*
 * TODO:
 * Remove Responder from require.cache when the Responder has been updated.
 * (git hook)
 */

function Response(nodeReq, nodeRes)
{
   this.nodeRequest = nodeReq;
   this.nodeResponse = nodeRes;

   // I use this server with nginx, so reqUrl.pathname ends up being
   // /some/path/relative/to/documentRoot
   // The logic of this might need to change in different server configurations.
   // I have all my Responders saved with an njs extension.
   // TODO: make the .njs extension configureable rather than static.
   var reqUrl = url.parse(nodeReq.url);

   try
   {
      this.responderModule = require(documentRoot + reqUrl.pathname + '.njs');
   } catch (e)
   {
      if (e.code == 'MODULE_NOT_FOUND')
      {
         // TODO: this should be a legitamate 404 response
         nodeRes.end('404');
         return this;
      }
      else
         throw e;
   }

   var responder = this.responderModule[nodeReq.method];

   if (responder) {
      this.responderInstance = responder(this);
      this.responderInstance.next();
   } else {
      // Right now the only public properties of a responder should be the
      // http methods. This will likely change.
      var methods = Object.keys(this.responderModule);

      nodeRes.writeHead('405', {
         Allow: methods.join(', ')
      });

      nodeRes.end('405');
   }
};

/*
 * This is the callback to be called when a service has completed. It resumes
 *  execution of the generator where it left off, passing <retVal> to the
 *  generator if there has been no error, otherwise throwing <err> which
 *  is then handled by the generator.
 */
Response.prototype.asyncCallback =
 function Response_asyncCallback(err, retVal)
{
   if (err)
      this.responderInstance.throw(err);
   else
      this.responderInstance.next(retVal);
}
