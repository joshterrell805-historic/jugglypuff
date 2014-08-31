module.exports = Index;

var Responder = require('../jugglypuff.njs').Responder;

function Index() {
   Responder.apply(this, arguments);
}

Index.prototype = Object.create(Responder.prototype);

Index.prototype.methods = {
   'GET': function* GET(cont, res) {
      res.write('you\'re on...');
      yield setTimeout(cont, 1000);
      res.end('the index page!');
   },
};
