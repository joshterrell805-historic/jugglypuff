
module.exports = log;
log.addModule = addModule;
log.setDefaultModule = setDefaultModule;

var util = require('util');

/*
 * Log a message.
 *
 * <message> the message to be logged.
 *
 * <type> (optional) the type of message to log. Can be any of the types
 *  specified in the options parameter passed to addModule. If <type> is falsy,
 *  the default type specified in options is used. If there is no default and
 *  type is falsy, an exception with code 'LOG_NO_DEFAULT_TYPE' is thrown.
 *
 * <module> (optional) the module name to log to. See addModule below. If falsy,
 *  log will log to the default module (set with log.setDefaultModule). An
 *  exception with code 'LOG_NO_DEFAULT_MODULE' is thrown if there is no default
 *  and module is falsy.
 */
function log(message, type, module) {

   if (!module) {

      module = defaultModule;

      if (!module) {
         var error = new Error('Log: the default module isn\'t defined');
         error.code = 'LOG_NO_DEFAULT_MODULE';
         throw error;
      }
   }

   if (!modules[module]) {
      var error = new Error('Log: the module ' + module + ' doesn\'t exist.');
      error.code = 'LOG_MODULE_NO_EXIST';
      throw error;
   }

   if (!type) {
      type = modules[module].__DEFAULT__;

      if (!type) {
         var error = new Error('Log: the default type for module ' + module +
          ' isn\'t defined');
         error.code = 'LOG_NO_DEFAULT_TYPE';
         throw error;
      }
   }

   var destinations = modules[module][type];

   if (!destinations) {
      var error = new Error('Log: the type ' + type + ' for module ' + module +
      ' isn\'t defined.');
      error.code = 'LOG_TYPE_NO_EXIST';
      throw error;
   }

   for (var destinationIndex in destinations) {
      destinations[destinationIndex].logger(
       destinations[destinationIndex].stream,
       message,
       type,
       module
      );
   }
}


/*
 * <name> the name of the module to be used by callers of log()
 *
 * <destinations> an array of destinations which have the following members
 *    <destination> a stream.Writable to log the messages to.
 *    <handledTypes> the types of messages to be output on this destination.
 *     <handledTypes> is an array of strings and/or objects. A string in
 *     this array is indicitive of this type using the defaultLogger
 *     (defined below). Objects in this array must have the the memebers
 *     <type> and <logger> where <type> is the string name of the type to be
 *     logged, and <logger> is a function that will be passed the parameters
 *     shown in defaultLogger and is expected to write the output to the stream.
 *     Note: the type name __DEFAULT__ is reserved.
 *  Additionally, the last element in <options> can (should) be a string with
 *   the value of the default type to be used when no type is specified in
 *   log().
 */
function addModule(name, destinations) {

   if (modules[name] !== undefined) {
      throw new Error('Module ' + name +
       ' cannot be added; it already exists.');
   }
   if (!destinations || !destinations.length) {
      throw new Error('Each module must have at least one destination.');
   }

   var module = {};

   for (var i = 0; i < destinations.length; ++i) {

      var destination = destinations[i];

      if (typeof destination === 'string') {

         if (i !== destinations.length - 1) {
            throw new Error('Only one default type may exist. It should be ' +
             'last element in the destinations array.');
         }
         if (i === 0) {
            throw new Error('Each module must have at least one destination.');
         }
         if (module[destination] === undefined) {
            throw new Error('The default type must be a type that exists in ' +
             'in at least one of the destinations\' handledTypes.');
         }

         module.__DEFAULT__ = destination;
      }
      else {
         var handledTypes = destination.handledTypes;

         if (!handledTypes || !handledTypes.length) {
            throw new Error('Each destination must handle at least one type.');
         }

         for (var typeIndex in handledTypes) {

            var type = handledTypes[typeIndex];

            if (typeof type === 'string') {

               if (type === '__DEFAULT__') {
                  throw new Error('The type name __DEFAULT__ is reserved.');
               }
               if (module[type] === undefined) {
                  module[type] = [];
               }

               module[type].push({
                  stream: destination.destination,
                  logger: defaultLogger
               });
            }
            else {
               if (typeof type.type !== 'string') {
                  throw new Error('An object in the handledTypes array must ' +
                   'have a string value for the attribute \'type\'.');
               }
               if (typeof type.logger !== 'function') {
                  throw new Error('An object in the handledTypes array must ' +
                   'have a function value for the attribute \'logger\'.');
               }
               if (type.type === '__DEFAULT__') {
                  throw new Error('The type name __DEFAULT__ is reserved.');
               }
               if (module[type.type] === undefined) {
                  module[type] = [];
               }

               module[type.type].push({
                  stream: destination.destination,
                  logger: type.logger
               });
            }
         }
      }
   }

   modules[name] = module;
}

function setDefaultModule(module) {
   if (modules[module] === undefined) {
      throw new Error('The default module must be an existing module.');
   }

   defaultModule = module;
}

var defaultModule;
var modules = {};

function defaultLogger(stream, message, type, module) {
   stream.write((new Date()).toISOString() + ' ' + module + ' (' + type +
    ') : ' + util.inspect(message) + '\n');
}
