module.exports = Responder;

var Promise = require('promise'),
    url = require('url'),
    debug = require('debug')('jugglypuff:responder'),
    ContinuousGenerator = require('ContinuousGenerator'),
    _ = require('underscore'),
    cookie = require('cookie');

ContinuousGenerator.configure({
   returnMethods: ['promise'],
   unhandledErrorMethods: ['promise'],
});

function Responder(runner) {
   var parsedUrl = url.parse(runner.req.url, true);

   this.runner = runner;
   this.req = this.runner.req;
   // this.req.body set in respond
   this.res = this.runner.res;
   this.query = parsedUrl.query;
   this.pathname = parsedUrl.pathname;
   this.cookiesToSet_ = {};
   this.responseCode_ = null;
   this.headersToSet_ = {};
}

/**
 * Respond to the request by invoking the appropriate responder then sending
 * the response.
 */
Responder.prototype.respond = function respond(method) {
   var generator = this.methods[method];

   if (!generator) {
      debug('no method found');
      var methods = Object.keys(this.methods);
      this.res.writeHead('405', {
         Allow: methods.join(', ')
      });
      this.res.end('405');
      return;
   }

   var postP = this.shouldGetPostData(method) ?
    this._getPostData(method) : Promise.resolve();

   postP
   .then(invokeResponderMethod.bind(this), postFail.bind(this))
   .then(function(b){return b;}, this.onUnhandledError)
   .done(this.sendResponse.bind(this));

   function invokeResponderMethod(postData) {
      this.req.body = postData;

      debug('invoking %s', method);
      return ContinuousGenerator.execute(generator, this, null);
   }
   function postFail(e) {
      // Error getting post data.
      if (e.code === 'DATA_LENGTH_EXCEEDED') {
         debug('post data length exceeded');
         this.setResponseCode('413');
         return e.message;
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

Responder.prototype.setHeader = function setHeader(name, value, overwrite) {
  if (!overwrite && this.headersToSet_[name])
    throw new Error('header already set');

  this.headersToSet_[name] = value;
};

Responder.prototype.setCookie =
    function setCookie(name, value, opts, overwrite) {
  if (!overwrite && this.cookiesToSet[name])
    throw new Error('cookie already set');
  
  opts = _.defaults({}, opts, {path: '/', secure: true, httpOnly: true});
  this.cookiesToSet_[name] = {
    value: value,
    opts: opts,
  };
};

Responder.prototype.setResponseCode =
    function setResponseCode(code, overwrite) {
  if (!ovewrite && this.responseCode_)
    throw new Error('Response code already set');
  this.responseCode_ = code;
};

Responder.prototype.sendResponse = function sendResponse(body) {
   debug('send response');
   // set headers
   var keys = Object.keys(this.headersToSet_);
   for (var i = 0; i < keys.length; ++i) {
      var name = keys[i];
      this.res.setHeader(name, this.headersToSet_[name]);
   }

   // set cookies
   var keys = Object.keys(this.cookiesToSet_);
   for (var i = 0; i < keys.length; ++i) {
      var name = keys[i];
      var c = this.cookiesToSet_[name];
      var str = cookie.serialize(name, c.value, c.opts);
      this.res.setHeader('Set-Cookie', str);
   }

   // set response code
   this.res.writeHead(this.responseCode_ || 200);

   // send body
   this.res.end(body);
};

/**
 * Return: a promise for the post data.
 *
 * Rejects with 'DATA_LENGTH_EXCEEDED' if the number of bytes in the post data
 *  is > this.POST_DATA_MAX_BYTES
 */
Responder.prototype._getPostData = function _getPostData() {
   var body = '';

   return new Promise(function(resolve, reject) {
      this.req.on('data', onData.bind(this));
      this.req.on('end', onEnd);

      function onData(data) {
         if (body.length + data.length >= this.POST_DATA_MAX_BYTES) {
            this.req.connection.destroy();
            var e = new Error('post body limit exceeded');
            e.code = 'DATA_LENGTH_EXCEEDED';
            reject(e);
         } else {
            body += data;
         }
      }
      function onEnd() {
         resolve(body);
      }
   }.bind(this));

};
Responder.prototype.POST_DATA_MAX_BYTES = 5000;

Responder.prototype.onUnhandledError = function onUnhandledError(err) {
   debug('unhandled error %o', err);
   this.setResponseCode('500', true);
   return '500: ' + err.message;
};
