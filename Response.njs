
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
      this.responder = require(documentRoot + reqUrl.pathname + '.njs');
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

   // Turn the responder generator into an instance
   this.responder = this.responder(this);
   this.responder.next();
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
      this.responder.throw(err);
   else
      this.responder.next(retVal);
}
