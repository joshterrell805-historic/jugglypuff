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

var fakeMysql = function(query, callback)
{
   setTimeout(function() {
      // this would be the sql call returning
      callback(null, query + ' burrito');
   }, 1000);
};

module.exports = {
   'Sql'   : function(response, query) { 
      fakeMysql(query, response.asyncCallback.bind(response));
   }
};
