module.exports = Responder;

var Promise = require('promise'),
    url = require('url'),
    debug = require('debug')('jugglypuff:responder');

function Responder(runner) {
   var parsedUrl = url.parse(runner.req.url, true);
   var success = function _continueGeneratorP_success(val) {
      this.generatorInstance.next(val);
   }.bind(this);
   var fail = function _continueGeneratorP_fail(err) {
      this.generatorInstance.throw(err);
   }.bind(this);

   this.runner = runner;
   this.req = this.runner.req;
   this.res = this.runner.res;
   this.query = parsedUrl.query;
   this.pathname = parsedUrl.pathname;
   this.cont = this._continueGenerator.bind(this);
   this.cont.p = function _continueGeneratorP(promise) {
      promise.done(success, fail);
   };
   // this.postData set in respond
   // this.generatorInstance set in respond
}

/**
 * Invoke the appropriate responder.
 */
Responder.prototype.respond = function respond(method) {
   var generator = this.methods[method];

   if (!generator) {
      debug('no method found');
      var methods = Object.keys(this.methods);
      res.writeHead('405', {
         Allow: methods.join(', ')
      });
      res.end('405');
      return;
   }

   var postP = this.shouldGetPostData(method) ?
    this._getPostData(method) : Promise.resolve();

   postP.done(invokeResponderMethod.bind(this), postFail.bind(this));

   function invokeResponderMethod(postData) {
      this.postData = postData;

      this.generatorInstance = generator.call(this, this.cont, this.res);

      debug('invoking %s', method);
      this.generatorInstance.next();
   }
   function postFail(e) {
      // Error getting post data.
      if (e.code === 'DATA_LENGTH_EXCEEDED') {
         debug('post data length exceeded');
         this.res.writeHead('413');
         this.res.end(e.message);
      } else {
         throw e;
      }
   }
};

/**
 * Should the post data be read and fed to the responder method?
 *
 * This is also a good place to set this.POST_DATA_MAX_BYTES if it should
 *  change for say.. users logged in as admins.
 */
Responder.prototype.shouldGetPostData = function shouldGetPostData(method) {
   return method === 'POST';
};

Responder.prototype.methods = {};

Responder.prototype._continueGenerator = function _continueGenerator(err, val) {
   setTimeout(function syncCallGuard() {
      if (err) {
         this.generatorInstance.throw(err);
      } else {
         this.generatorInstance.next(val);
      }
   }.bind(this), 0);
};

/**
 * Return: a promise for the post data.
 *
 * Rejects with 'DATA_LENGTH_EXCEEDED' if the number of bytes in the post data
 *  is > this.POST_DATA_MAX_BYTES
 */
Responder.prototype._getPostData = function _getPostData() {
   var body = '';

   return Promise.resolve().then(function _readPostData() {
      this.req.on('data', onData.bind(this));
      this.req.on('end', onEnd);

      function onData(data) {
         if (body.length + data.length >= this.POST_DATA_MAX_BYTES) {
            this.req.connection.destroy();
            var e = new Error('post body limit exceeded');
            e.code = 'DATA_LENGTH_EXCEEDED';
            throw e;
         } else {
            body += data;
         }
      }
      function onEnd() {
         return body;
      }
   }.bind(this));

};
Responder.prototype.POST_DATA_MAX_BYTES = 5000;
