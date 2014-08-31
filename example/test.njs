var Server = require("../jugglypuff.njs").Server;

var server = new Server({port: 1722, documentRoot: __dirname});
server.listen();
