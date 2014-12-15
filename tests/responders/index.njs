module.exports = SmokeResponder;
var jugglypuff = require('../../jugglypuff.njs');

function SmokeResponder(req, res) {
  jugglypuff.Responder.apply(this, arguments);
}
SmokeResponder.prototype = Object.create(jugglypuff.Responder.prototype);
SmokeResponder.prototype.methods = {
  'GET': function* GET() {
    this.setStatusCode(173);
  },
};
