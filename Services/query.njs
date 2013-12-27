
var fs = require('fs');
var mysql = require('mysql');

var connection = mysql.createConnection(GetConnectionOptions());

connection.connect(function(err) {
   if (err)
      throw err;
});

/*
 * <query> is a string query which may have placeholders
 * <parameters> is an array of parameters to be passed into the placeholders.
 *
 * ex)
 *  Services.query('select * from Products where Name = ?', ['taco'], callback);
 */

// query(query, parameters, callback)
module.exports = connection.query.bind(connection);

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
