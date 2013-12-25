
var http = require('http');
var Response = require('./Response.njs');
global.Services = require('./Services.njs');
global.Utilities = require('./Utilities.njs');

// TODO every responder needs this, but nothing else. This should go in some
// sort of responder parent class that includes the setup and teardown
// (when we get to that)
global.htmlReplace = require('./Utilities/htmlReplace.njs');

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

process.on('SIGINT', function() {
   process.exit(0);
});

/*
 * TODO:
 * Make syntax checker.
 * Add complete tests.
 * Responder testing framework?
 * Make a script for testing (starting and stopping server)
 * Be able to send signals to the program to reload certain modules
 */
