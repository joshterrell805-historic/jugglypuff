
var http = require('http');
var Response = require('./Response.njs');
global.Services = require('./Services.njs');

/*
 * TODO:
 * Parse command-line arguments for port and root (see Response.njs)
 * This is shitty... make it better.
 */


// notice using [2] instead of [3] even though there are four arguments.
// --harmony is not included in argv.
global.documentRoot = process.argv[2];
if (global.documentRoot === undefined)
{
   console.log('usage: node --harmony Main.njs <documentRoot>');
   process.exit();
}

http.createServer(function(req, res)
{
   new Response(req, res);
}).listen(7000);

/*
 * TODO:
 * Make syntax checker.
 * Add complete tests.
 * Responder testing framework?
 * Make a script for testing (starting and stopping server)
 */
