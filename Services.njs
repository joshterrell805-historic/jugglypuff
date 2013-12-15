/*
 *
 * A member of this object (key:value) is of the following form:
 *
 *    'service name' : asyncServiceFunction(response, parameters)
 *
 * where <asyncServiceFunction> calls the async service requested.
 *  <asyncServiceFunction> is a wraper responsible for passing or calling
 *  response.asyncCallback.bind(response) as the callback function for when
 *  the async operation has completed. See Response.prototype.asyncCallback.
 *
 * Example: Calling a Service (from a Responder)
 *
 *    var Services = require('./pathToThisFile');
 *
 *    try
 *    {
 *       var returnValue = yield Services['service name'](response,
 *        paramPassedTo_asyncServiceFunction);
 *    } catch (e)
 *    {
 *       // handle exception
 *    }
 *    
 *
 * Jose did something.
 *
 */

var fs = require('fs');


module.exports = {
   renderPage : renderPage
};

// TODO: add tests
var jade = require('jade');
// TODO: add signal to invalidate template upon change so server doesn't
// need to be restarted.
var JadeCompiled = {};


function renderPage(response, responderPath, templateVariables) {

   if (JadeCompiled[responderPath]) {
      // TODO: I don't like identicle code repeated. I just had a problem due
      // to this being repeated below
      var html = JadeCompiled[responderPath](templateVariables === undefined ?
       {} : templateVariables);

      // This is done like so because the generator needs to exit out of
      // its stack frame for asyncCallback to be called successfully.
      setTimeout(response.asyncCallback.bind(response, null, html),
       0);
   }
   else {
      // TODO: should there be some sort of check? or should we assume
      // that the responder filename is always correct?
      var regexp = /(.*\.)njs$/;
      var jadeTemplatePath = regexp.exec(responderPath)[1] + 'jade';

      // TODO: since this is Async, another request could be made too
      // and begin loading this same file. This needs to be handled!
      // I.e: if already loading, add request to a queue or something.
      fs.readFile(jadeTemplatePath, function(err, data) {
         // TODO: handle this error better
         if (err)
            throw err;

         var options = {
            filename: jadeTemplatePath,
            pretty: false,
            debug: false , // ditto as below
            compileDebug: false // disable for better performance
         };

         // TODO: add try/catch for syntax errors in jade file (so the server
         // doesn't crash on bad syntax.
         JadeCompiled[responderPath] = jade.compile(data.toString(), options);

         var html = JadeCompiled[responderPath](templateVariables ===
          undefined ? {} : templateVariables);

         setTimeout(response.asyncCallback.bind(response, null, html),
          0);

      });
   }

}
