var assert = require('assert'),
    Runner = require('../jugglypuff.njs').Runner,
    Promise = require('promise');

describe('Runner', function() {
  describe('#tryLoadModule', function() {
    it('should load correct module', function() {
      var module = Runner.prototype.tryLoadModule.call({
        server: {
          options: {
            responderRoot: process.env.PWD + '/tests/responders',
            responderExtension: '.njs',
          },
        },
      }, '/index');
      assert.strictEqual(module, require('./responders/index.njs'));
    });
    it('should return null on module not found', function() {
      var module = Runner.prototype.tryLoadModule.call({
        server: {
          options: {
            responderRoot: process.env.PWD + '/tests/responders',
            responderExtension: '.njs',
          },
        },
      }, '/a-file-which-does-not-exit');
      assert.strictEqual(module, null);
    });
    it('should propagate error thrown from requireing module', function() {
      try {
        var module = Runner.prototype.tryLoadModule.call({
          server: {
            options: {
              responderRoot: process.env.PWD + '/tests/responders',
              responderExtension: '.njs',
            },
          },
        }, '/throws-error');
      } catch (e) {
        return;
      }
      assert(false);
    });
  });
  describe('#loadResponderModule', function() {
    it('should try loading index, catchAll, then catchAllAll', function() {
      var loadCount = 0;
      var module = Runner.prototype.loadResponderModule.call({
        server: {
          options: {
            responderRoot: '',
            catchAllResponder: 'foo',
            catchAllAllResponder: 'bar',
          },
        },
        tryLoadModule: function tryLoadModule(pathname) {
          switch(++loadCount) {
          case 1:
            var expected = '/asdf/zzz';
            break;
          case 2:
            var expected = '/asdf/foo';
            break;
          case 3:
            var expected = '/bar';
            break;
          default:
            throw new Error('Illegal loadCount');
          }
          return null;
        },
      }, '/asdf/zzz');
      assert.strictEqual(loadCount, 3);
      assert.strictEqual(module, null);
    });
    it('should try loading exact, catchAll, then catchAllAll', function() {
      var loadCount = 0;
      var module = Runner.prototype.loadResponderModule.call({
        server: {
          options: {
            responderRoot: '',
            indexResponder: 'rawr',
            catchAllResponder: 'bar',
            catchAllAllResponder: 'tzar',
          },
        },
        tryLoadModule: function tryLoadModule(pathname) {
          switch(++loadCount) {
          case 1:
            var expected = '/asdf/rawr';
            break;
          case 2:
            var expected = '/asdf/bar';
            break;
          case 3:
            var expected = '/tzar';
            break;
          default:
            throw new Error('Illegal loadCount');
          }
          return null;
        },
      }, '/asdf/');
      assert.strictEqual(loadCount, 3);
      assert.strictEqual(module, null);
    });
  });
});
