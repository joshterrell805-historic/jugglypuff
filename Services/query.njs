
var fs = require('fs');
var mysql = require('mysql');

/*
 * <query> is a string query which may have placeholders
 * <parameters> is an array of parameters to be passed into the placeholders.
 *
 * ex)
 *  Services.query('select * from Products where Name = ?', ['taco'], callback);
 */

module.exports = function(query, parameters, callback) {
   // This must be a closure so that after reconnects this function/module
   //  will always resolve 'connection' to the active mysql connection.

   // TODO what happens if a query happens while the connection is resolving?
   // I think this will pass an error to the callback and all will be okay.
   // test this.
   connection.query(query, parameters, callback);
}

/*
 * This gets the connection options (username, password, database, host, ..)
 * from the file below. The file must be in the working directory.
 *
 * It's recommended to add the following file to .gitignore
 *
 * TODO figure out a better way to do this
 */
function GetConnectionOptions() {
   return JSON.parse(
    fs.readFileSync('.mysqlConnectionOptions.json', {encoding: 'utf8'})
   );
}

var connection;
var connectAttempts = 0;
var maxConnectAttempts = 5;
var connectAttemptDelay = 2000;

function connect() {

   if (connectAttempts === maxConnectAttempts) {
      throw new Error('A connection to mysql could not be established.');
   }

   ++connectAttempts;
   connection = mysql.createConnection(GetConnectionOptions());

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

connect();
