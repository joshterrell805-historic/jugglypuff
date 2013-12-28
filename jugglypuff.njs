/*
 * TODO:
 * Make syntax checker.
 * Add complete tests.
 * Responder testing framework?
 * Be able to send signals to the server to reload certain modules, services,
 *  and utilities.
 */

var server;

/*
 * __jugglypuff__ settings must be set by the serverImplementor
 * this variable is reserved by jugglypuff.. I don't think there will be name
 * clashes lol.
 *
 * Settings:
 *    loggingEnabled -- see enableLogging() for info on what what properties
 *     are mutable.
 *
 */

if (!global.__jugglypuff__)
   global.__jugglypuff__ = {};

module.exports = {

   start: function(port, documentRoot) {

      if (__jugglypuff__.loggingEnabled)
         enableLogging();

      var http = require('http');
      var Response = require('./Response.njs')(documentRoot);

      server = http.createServer(function(req, res) {
         new Response(req, res);
      });

      server.listen(port, function() {
         if (__jugglypuff__.loggingEnabled) {
            __jugglypuff__.log('listening on port ' + port,
             __jugglypuff__.logOptions.jugglypuff.types.info.name,
             __jugglypuff__.logOptions.jugglypuff.name);
         }
      });

      return server;
   },
   kill: function(callback) {
      server.close(function() {
         if (callback)
            callback();
         process.exit(0);
      });
   }
};

process.on('SIGINT', function() {
   module.exports.kill();
});

function enableLogging() {
   var j = __jugglypuff__;
   j.log = require('./Utilities/log.njs');

   if (!j.logOptions) j.logOptions = {};

   // for general server messages
   if (!j.logOptions.jugglypuff)
      j.logOptions.jugglypuff = {};
   if (!j.logOptions.jugglypuff.name)
      j.logOptions.jugglypuff.name = 'Server';
   if (!j.logOptions.jugglypuff.types)
      j.logOptions.jugglypuff.types = {};
   if (!j.logOptions.jugglypuff.types.error)
      j.logOptions.jugglypuff.types.error =
       {name: 'Error', stream: process.stdout};
   if (!j.logOptions.jugglypuff.types.info)
      j.logOptions.jugglypuff.types.info =
       {name: 'Info', stream: process.stdout};

   // for mysql messages
   if (!j.logOptions.query)
      j.logOptions.query = {};
   if (!j.logOptions.query.name)
      j.logOptions.query.name = 'MySql';
   if (!j.logOptions.query.types)
      j.logOptions.query.types = {};
   if (!j.logOptions.query.types.error)
      j.logOptions.query.types.error = {name: 'Error', stream: process.stdout};
   if (!j.logOptions.query.types.info)
      j.logOptions.query.types.info = {name: 'Info', stream: process.stdout};


   var moduleKeys = Object.keys(j.logOptions);

   for (var moduleKey in moduleKeys) {

      var module = j.logOptions[moduleKeys[moduleKey]];
      var typeKeys = Object.keys(module.types);

      var destinations = [];

      for (var typeKey in typeKeys) {
         var type = module.types[typeKeys[typeKey]];
         destinations.push({
            destination: type.stream,
            handledTypes: [type.name]
         });
      }

      j.log.addModule(module.name, destinations);
   }
}
