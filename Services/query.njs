
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
      throw new Error('A connection to mysql could not be established.');
   }

   ++connectAttempts;
   connection = mysql.createConnection(connectOptions);

   connection.connect(function(error) {
      if (error) {
         console.error('Mysql Connection Error:', error.message);
         setTimeout(connect, connectAttemptDelay);
      }
      else {
         connectAttempts = 0;
         console.log('Mysql:', 'connected successfully');
      }
   });

   connection.on('error', function (error) {

      console.error('Mysql Error:', error.message);

      switch (error.code) {

      case 'PROTOCOL_CONNECTION_LOST':
         connect();
         break;

      default:
         throw error;

      }

   });
}
