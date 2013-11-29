
var http = require('http');
var Response = require('./Response.njs');
global.Services = require('./Services.njs');

// --harmony is not included in argv
var listeningPort = process.argv[2];
global.documentRoot = process.argv[3];

if (global.documentRoot === undefined)
{
   console.log('usage: node --harmony Main.njs <port> <documentRoot>');
   process.exit();
}

http.createServer(function(req, res)
{
   new Response(req, res);
}).listen(listeningPort);

/*
 * TODO:
 * Make syntax checker.
 * Add complete tests.
 * Responder testing framework?
 * Make a script for testing (starting and stopping server)
 */
