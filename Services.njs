/*
 * Members of this object provide services that are (or sometimes are)
 *  asychronus. Examples include queries, cache lookups, and receiving data from
 *  the client.
 *
 * A member of this object (key:value) is of the following form:
 *
 *    'service name' : asyncService(parameter1, parameter2, ... , callback)
 *
 * where <asyncService> calls (or is) the async service requested.
 *  <asyncService> is responsible for calling the callback parameter with the
 *  parameters error and value. Eg: callback(error, value);
 */

// TODO let the server implementer choose which services to add to this object.

module.exports = {
   doWork: require('./Services/doWork.njs'),
   getPostData: require('./Services/getPostData.njs'),
   query: require('./Services/query.njs'),
   readFile: require('./Services/readFile.njs')
};
