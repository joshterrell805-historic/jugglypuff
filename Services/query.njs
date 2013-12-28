
var mysql = require('mysql');

/*
 * <query> is a string query which may have placeholders
 * <parameters> is an array of parameters to be passed into the placeholders.
 *
 * ex)
 *  Services.query('select * from Products where Name = ?', ['taco'], callback);
 */

module.exports = function(connectionOptions) {

   // options to pass to mysql.createConnection
   connectOptions = connectionOptions;
   connect();

   return function(query, parameters, callback) {
      // This must be a closure so that after reconnects this function/module
      //  will always resolve 'connection' to the active mysql connection.
      connection.query(query, parameters, callback);
   };
}

var connection;
var connectOptions;
var connectAttempts = 0;
var maxConnectAttempts = 5;
var connectAttemptDelay = 2000;

function connect() {

   if (connectAttempts === maxConnectAttempts) {
      var errorMessage = 'Max attempts reached while a connection to mysql ' +
       'was being established.';
      if (__jugglypuff__.loggingEnabled) {
         __jugglypuff__.log(errorMessage,
          __jugglypuff__.logOptions.query.types.error.name,
          __jugglypuff__.logOptions.query.name);
      }
      var error = new Error(errorMessage);
      error.code = 'MYSQL_MAX_CONNECT_ATTEMPTS_REACHED';
      throw error;
   }

   ++connectAttempts;
   connection = mysql.createConnection(connectOptions);

   connection.connect(function(error) {
      if (error) {
         if (__jugglypuff__.loggingEnabled) {
            __jugglypuff__.log(error.message,
             __jugglypuff__.logOptions.query.types.error.name,
             __jugglypuff__.logOptions.query.name);
         }

         setTimeout(connect, connectAttemptDelay);
      }
      else {

         connectAttempts = 0;

         if (__jugglypuff__.loggingEnabled) {
            __jugglypuff__.log('connected successfully',
             __jugglypuff__.logOptions.query.types.info.name,
             __jugglypuff__.logOptions.query.name);
         }
      }
   });

   connection.on('error', function (error) {

      if (__jugglypuff__.loggingEnabled) {
         __jugglypuff__.log(error.message,
          __jugglypuff__.logOptions.query.types.error.name,
          __jugglypuff__.logOptions.query.name);
      }

      switch (error.code) {

      case 'PROTOCOL_CONNECTION_LOST':
         connect();
         break;

      default:
         throw error;

      }

   });
}
