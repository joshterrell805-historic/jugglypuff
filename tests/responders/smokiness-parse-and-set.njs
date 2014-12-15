module.exports = SmokeResponder;
var jugglypuff = require('../../jugglypuff.njs'),
    Promise = require('promise');

function SmokeResponder(req, res) {
  jugglypuff.Responder.apply(this, arguments);
}
SmokeResponder.prototype = Object.create(jugglypuff.Responder.prototype);
SmokeResponder.prototype.methods = {
  'POST': function* POST() {
    this.setCookie('sessionId', yield Promise.resolve('142287'),
        {path: '/asdf', secure: false, httpOnly: false});
    this.setCookie('zzzzz', yield Promise.resolve('asdf'),
        {path: '/xf27', secure: true, httpOnly: true});
    this.setHeader(yield Promise.resolve('Location'), '59');
    this.setHeader(yield Promise.resolve('Shindig'), '82');
    return yield this.req.getBody();
  },
};
