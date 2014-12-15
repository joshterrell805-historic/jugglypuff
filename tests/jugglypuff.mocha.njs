var assert = require('assert'),
    jugglypuff = require('../jugglypuff.njs'),
    Server = jugglypuff.Server,
    Promise = require('promise'),
    cookie = require('cookie');

describe('jugglypuff', function() {
  describe('smokiness', function() {
    it('should locate and invoke correct responder', function(done) {
      var opts = {
        responderRoot: process.env.PWD + '/tests/responders',
        port: 44128,
      };
      var server = new Server(opts);
      server.start().done(function() {
        require('http').get({
          host: 'localhost',
          port: '44128',
          method: 'GET',
          path: '/',
        }, function(res) {
          assert.equal(res.statusCode, 173);
          server.on('stop', done);
          server.stop();
        }).on('error', done);
      });
    });
    it('should parse req-body, set status code, cookies, headers, body',
        function(done) {
      var opts = {
        responderRoot: process.env.PWD + '/tests/responders',
        port: 44130,
      };
      var server = new Server(opts);
      server.start().done(function() {
        var req = require('http').request({
          host: 'localhost',
          port: '44130',
          method: 'POST',
          path: '/smokiness-parse-and-set',
        }, function(res) {
          assert.strictEqual(res.headers.location, '59');
          assert.strictEqual(res.headers.shindig, '82');
          assert.strictEqual(res.headers['set-cookie'].length, 2);
          assert.strictEqual(res.headers['set-cookie'][0],
              cookie.serialize('sessionId', '142287',
                  {path: '/asdf', secure: false, httpOnly: false}));
          assert.strictEqual(res.headers['set-cookie'][1],
              cookie.serialize('zzzzz', 'asdf',
                  {path: '/xf27', secure: true, httpOnly: true}));

          var body = '';
          res.on('data', function(data) {
            body += data;
          });
          res.on('end', function() {
            assert.strictEqual(body, '678334');
            server.on('stop', done);
            server.stop();
          });
        });
        req.end('678334');
        req.on('error', done);
      });
    });
  });
});

