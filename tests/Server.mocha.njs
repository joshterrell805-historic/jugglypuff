var assert = require('assert'),
    jugglypuff = require('../jugglypuff.njs'),
    Server = jugglypuff.Server,
    Promise = require('promise');

describe('Server', function() {
  describe('#constructor', function() {
    it('should set options', function() {
      var opts = {
        port: 44129,
        hostname: 'taco',
        runnerModule: Promise,
      };
      var server = new Server(opts);
      assert.strictEqual(server.options.port, 44129);
      assert.strictEqual(server.options.hostname, 'taco');
      assert.strictEqual(server.options.runnerModule, Promise);
      assert.strictEqual(server.options.catchAllResponder, '_');
      assert.strictEqual(server.options.responderExtension, '.njs');
    });
  });
  describe('#start and #stop', function() {
    it('should start and stop', function(done) {
      var opts = {
        port: 44129,
      };
      var server = new Server(opts);
      server.start().done(server.stop.bind(server));
      server.on('stop', function() {
        assert(!server.running);
        done();
      });
    });
  });
  describe('#stop', function() {
    it('should stop on SIGINT', function(done) {
      var opts = {
        port: 44129,
      };
      var listeners = process.listeners('SIGINT');
      process.removeAllListeners('SIGINT');
      var server = new Server(opts);
      server.start().done(function() {
        process.emit('SIGINT');
      });
      server.on('stop', function() {
        assert(!server.running);
        listeners.forEach(function(l) {
          process.addListener('SIGINT', l);
        });
        done();
      });
    });
  });
  describe('#start', function() {
    it('should pass http requests to #handleRequests', function(done) {
      var opts = {
        port: 44129,
      };
      var server = new Server(opts);
      server.handleRequest = function handleRequest(req, res) {
        assert.strictEqual(require('url').parse(req.url).pathname, '/');
        res.end();
        server.on('stop', done);
        server.stop();
      };
      server.start().done(function() {
        require('http').get({
          host: 'localhost',
          port: '44129',
          method: 'GET',
          path: '/',
        }, function(res) {
        }).on('error', done);
      });
    });
  });
});
