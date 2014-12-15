var assert = require('assert'),
    Responder = require('../jugglypuff.njs').Responder,
    Promise = require('promise'),
    cookie = require('cookie');

describe('Responder', function() {
  describe('#constructor', function() {
    it('should set properties (e.g. cookies and query)', function() {
      var req = {
        url: 'http://horchata.com/crap/derp?for=sure&tacos=true',
        headers: {
          cookie: 'monster=yumm; pumpkins=ocean',
        },
      };
      var res = {jimmy: 'JIMMY'};
      var r = new Responder(req, res);
      assert.strictEqual(r.req, req);
      assert.strictEqual(r.res, res);
      assert.strictEqual(r.req.query.for, 'sure');
      assert.strictEqual(r.req.query.tacos, 'true');
      assert.strictEqual(r.req.pathname, '/crap/derp');
      assert.strictEqual(r.req.cookies.monster, 'yumm');
      assert.strictEqual(r.req.cookies.pumpkins, 'ocean');
    });
  });
  describe('#run', function() {
    it('should error with 405 on method not found', function() {
      var endHappend = false;
      var req = {
        method: 'TACO',
        url: '/asdf',
        headers: {},
      };
      var res = {
        writeHead: function writeHead(code, headers) {},
        end: function end(text) {
          assert.strictEqual(text, '405');
          endHappend = true;
        },
      };
      var r = new Responder(req, res);
      // respond should not get called
      r.respond = function() {assert(false);};
      r.run();
      assert(endHappend);
    });
    it('should call respond on method found', function() {
      var req = {
        method: 'TACO',
        url: '/asdf',
        headers: {},
      };
      var r = new Responder(req, null);
      r.methods = {'TACO': 'asdf'};
      var respondCalled = false;
      r.respond = function() {respondCalled = true;};
      r.run();
      assert(respondCalled);
      assert.strictEqual(r.methodGenerator, 'asdf');
    });
  });
  describe('#respond', function() {
    it('should pass retval of generator to sendResponse', function(done) {
      var req = {
        method: 'TACO',
        url: '/asdf',
        headers: {},
      };
      var r = new Responder(req, null);
      r.methods = {
        TACO: function* () {
          var x = yield Promise.resolve('five');
          return x;
        },
      };
      r.sendResponse = function(body) {
        assert.strictEqual(body, 'five');
        done();
      };
      r.run();
    });
    it('should throw unhandledMethodError if no listeners', function(done) {
      var req = {
        method: 'TACO',
        url: '/asdf',
        headers: {},
      };
      var r = new Responder(req, null);
      r.methods = {
        TACO: function* () {
          throw 'error dude';
        },
      };
      var listeners = process.listeners('uncaughtException');
      process.removeAllListeners();
      process.addListener('uncaughtException', function listener(err) {
        assert.strictEqual(err, 'error dude');
        process.removeListener('uncaughtException', listener);
        listeners.forEach(function(l) {
          process.addListener('uncaughtException', l);
        });
        done();
      });
      r.run();
    });
    it('should not throw unhandledMethodError if listener(s)', function(done) {
      var req = {
        method: 'TACO',
        url: '/asdf',
        headers: {},
      };
      var r = new Responder(req, null);
      r.methods = {
        TACO: function* () {
          throw 'error dude';
        },
      };
      r.on('unhandledMethodError', function(responder, err) {
        assert.strictEqual(responder, r);
        assert.strictEqual(err, 'error dude');
        done();
      });
      r.run();
    });
  });
  describe('#setHeader', function() {
    it('should add header to headersToSet_', function() {
      var dis = {headersToSet_:{}}
      Responder.prototype.setHeader.call(dis, 'header', 'value');
      assert.strictEqual(dis.headersToSet_.header, 'value');
    });
    it('should throw error on second call with same name', function() {
      var dis = {headersToSet_:{'header': 'value'}}
      try {
        Responder.prototype.setHeader.call(dis, 'header', 'value-2');
      } catch (e) {
        // value unchanged
        assert.strictEqual(dis.headersToSet_.header, 'value');
        assert.strictEqual(e.code, 'HEADER_OVERWRITE');
        return;
      }
      assert(false);
    });
    it('should overwrite if overwrite flag set', function() {
      var dis = {headersToSet_:{'header': 'value'}}
      Responder.prototype.setHeader.call(dis, 'header', 'value-2', true);
      assert.strictEqual(dis.headersToSet_.header, 'value-2');
    });
  });
  describe('#setCookie', function() {
    it('should add cookie to cookiesToSet_ with proper defaults', function() {
      var dis = {cookiesToSet_:{}}
      Responder.prototype.setCookie.call(dis, 'rawer', 'value', {path:'/asdf'});
      assert.strictEqual(dis.cookiesToSet_.rawer.value, 'value');
      assert.strictEqual(dis.cookiesToSet_.rawer.opts.path, '/asdf');
      assert.strictEqual(dis.cookiesToSet_.rawer.opts.secure, true);
      assert.strictEqual(dis.cookiesToSet_.rawer.opts.httpOnly, true);
    });
    it('should throw error on second call with same name', function() {
      var dis = {cookiesToSet_:{'cookiez': {value:'value', opts:{}}}}
      try {
        Responder.prototype.setCookie.call(dis, 'cookiez', 'value-2');
      } catch (e) {
        // value unchanged
        assert.strictEqual(dis.cookiesToSet_.cookiez.value, 'value');
        assert.strictEqual(e.code, 'COOKIE_OVERWRITE');
        return;
      }
      assert(false);
    });
    it('should overwrite if overwrite flag set', function() {
      var dis = {cookiesToSet_:{'cookie': 'value'}}
      Responder.prototype.setCookie.call(dis, 'cookie', 'value-2', {}, true);
      assert.strictEqual(dis.cookiesToSet_.cookie.value, 'value-2');
    });
  });
  describe('#setStatusCode', function() {
    it('should set statusCode_', function() {
      var dis = {statusCode_: undefined};
      Responder.prototype.setStatusCode.call(dis, '307');
      assert.strictEqual(dis.statusCode_, '307');
    });
    it('should throw error on second call', function() {
      var dis = {statusCode_: '307'};
      try {
        Responder.prototype.setStatusCode.call(dis, '400');
      } catch (e) {
        assert.strictEqual(dis.statusCode_, '307');
        assert.strictEqual(e.code, 'STATUS_OVERWRITE');
        return;
      }
      assert(false);
    });
    it('should overwrite if overwrite flag set', function() {
      var dis = {statusCode_: '307'};
      Responder.prototype.setStatusCode.call(dis, '2', true);
      assert.strictEqual(dis.statusCode_, '2');
    });
  });
  describe('#sendResponse', function() {
    it('should set headers', function(done) {
      var count = 0;
      var dis = {
        'headersToSet_': {
          'Location': 'zzzzzz',
          'etag': 14,
        },
        'cookiesToSet_': {},
        'res': {
          'setHeader': function setHeader(name, val) {
            switch(++count) {
            case 1:
              assert.strictEqual(name, 'Location');
              assert.strictEqual(val, 'zzzzzz');
              break;
            case 2:
              assert.strictEqual(name, 'etag');
              assert.strictEqual(val, 14);
              done();
              break;
            default:
              throw new Error('invalid count');
            }
          },
          'writeHead': function(code) {},
          'end': function(body) {},
        },
      };
      Responder.prototype.sendResponse.call(dis);
    });
    it('should set cookies', function(done) {
      var count = 0;
      var dis = {
        'cookiesToSet_': {
          'cookie-1': {
            'value': 'value-of-cookie-1',
            'opts': {
              'path': '/asdfzz/2',
              'secure': true,
              'httpOnly': false,
            },
          },
          'cookie-2': {
            'value': 'value-of-cookie-2',
            'opts': {
              'path': '/',
              'secure': false,
              'httpOnly': true,
            },
          }
        },
        'headersToSet_': {},
        'res': {
          'setHeader': function setHeader(name, val) {
            assert.strictEqual(name, 'Set-Cookie');
            assert.strictEqual(val.length, 2);
            var n = 'cookie-1=value-of-cookie-1';
            assert.strictEqual(val[0].substr(0, n.length), n);
            var n = 'cookie-2=value-of-cookie-2';
            assert.strictEqual(val[1].substr(0, n.length), n);
            done();
          },
          'writeHead': function(code) {},
          'end': function(body) {},
        },
      };
      Responder.prototype.sendResponse.call(dis);
    });
    it('should set statusCode', function() {
      var count = 0;
      var dis = {
        'cookiesToSet_': {},
        'headersToSet_': {},
        'res': {
          'setHeader': function setHeader(name, val) {},
          'writeHead': function(code) {
            switch(++count) {
            case 1:
              assert.strictEqual(code, 200);
              break;
            case 2:
              assert.strictEqual(code, '40');
              break;
            default:
              throw new Error('invalid count');
            }
          },
          'end': function(body) {},
        },
      };
      Responder.prototype.sendResponse.call(dis);
      dis.statusCode_ = '40';
      Responder.prototype.sendResponse.call(dis);
      assert.strictEqual(count, 2);
    });
    it('should send body', function(done) {
      var dis = {
        'cookiesToSet_': {},
        'headersToSet_': {},
        'res': {
          'setHeader': function setHeader(name, val) {},
          'writeHead': function(code) {},
          'end': function(body) {
            assert.strictEqual(body, 'chalupa');
            done();
          },
        },
      };
      Responder.prototype.sendResponse.call(dis, 'chalupa');
    });
  });
});
