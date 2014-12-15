module.exports = Responder;

var Promise = require('promise'),
    url = require('url'),
    debug = require('debug')('jugglypuff:Responder'),
    ContGen = require('ContinuousGenerator'),
    _ = require('underscore'),
    cookie = require('cookie'),
    CError = require('ExtendableError').CodedError,
    EventEmitter = require('events').EventEmitter;

/**
 * Events:
 *   unhandledMethodError(responder, error)
 */
function Responder(req, res) {
  this.req = req;
  this.res = res;

  this.cookiesToSet_ = {};
  this.statusCode_ = null;
  this.headersToSet_ = {};

  var parsedUrl = url.parse(req.url, true);
  this.req.query = parsedUrl.query;
  this.req.pathname = parsedUrl.pathname;
  this.req.cookies = this.req.headers.cookie ?
      cookie.parse(this.req.headers.cookie) : {};
  // promise for body
  this.req.getBody = function getBody() {
    if (!getBody.promise) {
      getBody.promise = new Promise(function getBodyP(resolve, reject) {
        var body = '';
        this.req.on('end', function onEnd() {resolve(body);});
        this.req.on('data', function onData(data) {
          if (body.length + data.length >= this.POST_DATA_MAX_BYTES) {
            this.req.connection.destroy();
            reject(new CError('DATA_LENGTH_EXCEEDED', 'post body limit exceeded'));
          } else {
            body += data;
          }
        }.bind(this));
      }.bind(this));
    }
    return getBody.promise;
  }.bind(this);
}

Responder.prototype = Object.create(EventEmitter.prototype);

Responder.prototype.POST_DATA_MAX_BYTES = 64 * 1024;

Responder.prototype.run = function run() {
  var Generator = this.methods[this.req.method];

  if (!Generator) {
    debug('no method found');
    var methods = Object.keys(this.methods);
    this.res.writeHead('405', {
      Allow: methods.join(', ')
    });
    return this.res.end('405');
  }

  this.methodGenerator = Generator;
  this.respond();
};

/**
 * Respond to the request by invoking the appropriate responder then sending
 * the response.
 */
Responder.prototype.respond = function respond() {
  ContGen(this.methodGenerator, this)
  .done(this.sendResponse.bind(this), function onError(err) {
    if (!this.emit('unhandledMethodError', this, err))
      throw err;
  }.bind(this));
};

Responder.prototype.methods = {};

Responder.prototype.setHeader = function setHeader(name, value, overwrite) {
  if (!overwrite && this.headersToSet_[name])
    throw new CError('HEADER_OVERWRITE', 'header already set');
  this.headersToSet_[name] = value;
};

Responder.prototype.setCookie = function setCookie(name, value, opts,
    overwrite) {
  if (!overwrite && this.cookiesToSet_[name])
    throw new CError('COOKIE_OVERWRITE', 'cookie already set');
  
  opts = _.defaults({}, opts, {path: '/', secure: true, httpOnly: true});
  this.cookiesToSet_[name] = {
    value: value,
    opts: opts,
  };
};

Responder.prototype.setStatusCode = function setStatusCode(code, overwrite) {
  if (!overwrite && this.statusCode_)
    throw new CError('STATUS_OVERWRITE', 'Status code already set');
  this.statusCode_ = code;
};

Responder.prototype.redirect = function redirect(code, url) {
  // 301:perm
  // 307:temp
  // 303:modify
  this.setResponseCode(code);
  this.setHeader('Location', url);
}

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
  var cookieStrs = keys.map(function(key) {
    var c = this.cookiesToSet_[key];
    return cookie.serialize(key, c.value, c.opts);
  }.bind(this));
  if (cookieStrs.length > 0) {
    this.res.setHeader('Set-Cookie', cookieStrs);
  }

  // set response code
  this.res.writeHead(this.statusCode_ || 200);

  // send body
  this.res.end(body);
};
