/*
 * Members of this object provide responder services that are (or sometimes are)
 *  asychronus. Examples include queries, cache lookups, and receiving data from
 *  the client.
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

// TODO let the server implementer choose which services to add to this object.

module.exports = {
   getPostData : require('./Services.getPostData.njs')
};
