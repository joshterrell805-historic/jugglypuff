module.exports = Responder;

var Promise = require('promise'),
    url = require('url'),
    debug = require('debug')('jugglypuff:responder');

function Responder(response) {
   this.response = response;
}

/**
 * Invoke the appropriate responder.
 */
Responder.prototype.respond = function respond(method) {
   var generator = this.methods[method];

   if (generator) {
      // before invoking, store the query and postData on the `this` object.
      this.query = url.parse(this.response.nodeReq.url, true).query;
      this._getPostData().done(function(postData) {
         this.postData = postData;
         this.generatorInstance = generator.call(this, this.response.nodeRes,
          this._continueGenerator.bind(this));
         debug('invoking %s', method);
         this.generatorInstance.next();
      }.bind(this), function(e) {
         // Error getting post data.
         if (e.code === 'DATA_LENGTH_EXCEEDED') {
            debug('post data length exceeded');
            this.nodeRes.writeHead('413');
            this.nodeRes.end(e.message);
         } else {
            throw e;
         }
      });
   } else {
      debug('no method found');
      var methods = Object.keys(this.methods);
      nodeRes.writeHead('405', {
         Allow: methods.join(', ')
      });
      nodeRes.end('405');
   }
};

Responder.prototype.methods = {};

Responder.prototype._continueGenerator = function _continueGenerator(err, val) {
   if (err) {
      this.generatorInstance.throw(err);
   } else {
      this.generatorInstance.next(val);
   }
};

/**
 * Return: a promise for the post data.
 *
 * Rejects with 'DATA_LENGTH_EXCEEDED' if the number of bytes in the post data
 *  is > this.POST_DATA_MAX_BYTES
 */
Responder.prototype._getPostData = function _getPostData() {
   var body = '';

   return new Promise(function (resolve, reject) {
      this.response.nodeReq.on('data', function onData(data) {
         if (body.length + data.length >= this.POST_DATA_MAX_BYTES) {
            this.response.nodeReq.connection.destroy();
            var e = new Error('post body limit exceeded');
            e.code = 'DATA_LENGTH_EXCEEDED';
            reject(e);
         } else {
            body += data;
         }
      }.bind(this));

      this.response.nodeReq.on('end', function onEnd() {
         resolve(body);
      });
   }.bind(this));
};
Responder.prototype.POST_DATA_MAX_BYTES = 5000;
