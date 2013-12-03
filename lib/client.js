/**
 * Dependencies.
 */

var utils = require('./utils');
var request = require('superagent');
var debug = require('debug')('etcd-node');

/**
 * Export.
 */

module.exports = Client;

/**
 * Initialize a new client.
 *
 * @see configure()
 */

function Client(opts) {
  this.version = 'v2';
  this.configure(opts || {});
}

/**
 * Configure connection options.
 *
 * Settings:
 *
 *  - port
 *  - host
 *
 * TODO: ssl
 *
 * @param {Object} opts
 * @return {Client}
 * @public
 */

Client.prototype.configure = function (settings) {
  this.host = settings.host || '127.0.0.1';
  this.port = settings.port || 4001;
  this.ssl = settings.scheme == 'https';

  debug('configure - port:%s', this.port);
  debug('configure - host:%s', this.host);
  debug('configure - ssl:%s', this.ssl);

  return this;
};

/**
 * Machines.
 *
 * TODO: look into `res.error`.
 *
 * @param {Function} cb
 * @public
 */

Client.prototype.machines = function (cb) {
  return request
  .get(this.url('machines'))
  .end(function (err, res) {
    if (err) return cb(err);
    cb(null, res.text.split(/,\s/));
  });
};

/**
 * Leader.
 *
 * TODO: look into `res.error`.
 *
 * @param {Function} cb
 * @public
 */

Client.prototype.leader = function (cb) {
  return request
  .get(this.url('leader'))
  .end(function (err, res) {
    if (err) return cb(err);
    cb(null, res.text);
  });
};


/**
* Read.
*
* @param {Object} options
* @return {Object}
* @public
*/

Client.prototype.read = function (options, cb) {
  if (!options) options = {};

  var opts = {};
  opts.method = 'GET';
  opts.key = options.key || '/';
  opts.qs = {};
  if (options.recursive != undefined) {
    opts.qs.recursive = options.recursive;
  }

  if (options.wait != undefined) {
    opts.qs.wait = options.wait;
  }

  if (options.wait_index != undefined) {
    opts.qs.waitIndex = options.wait_index;
  }

  return this._call(opts, cb);

};

Client.prototype._call = function (options, callback) {
  options.url = this.url('keys', options.key);
  delete options.key;
  return request(options, callback);
};
/**
 * Get.
 *
 * @param {String} key
 * @param {Function} cb
 * @return {Client}
 * @public
 */

Client.prototype.get = function (key, cb) {
  return this.read({'key': key}, cb);
};

/**
 * Delete.
 *
 * @param {String} key
 * @param {Function} cb
 * @return {Client}
 * @public
 */

Client.prototype.del = function (key, cb) {
  var opts = {'method': 'DELETE'};
  opts.key = key;
  return this._call(opts, cb);
};

/**
 * List.
 *
 * @param {String} prefix
 * @param {Function} cb
 * @return {Client}
 * @public
 */

Client.prototype.list = function (prefix, cb) {
  return this.read({'key': prefix,  'recursive': true}, cb);
};

Client.prototype.write(options, cb) {
  var opts = {'method': 'PUT'};
  opts.form = {'value': options.value};
  if ('ttl' in options) opts.form.ttl = options.ttl;
  if ('prev_exists' in options) opts.form.prevExists = options.prev_exists;
  if ('prev_index' in options) opts.form.prevIndex = options.prev_index;
  if ('prev_value' in options) opts.form.prevValue = options.prev_value;
  return this._call(options, cb);
}
/**
 * Set.
 *
 * @param {String} key
 * @param {Mixed} value
 * @param {Function} cb
 * @return {Client}
 * @public
 */

Client.prototype.set = function (key, value, options, cb) {
  if ('function' === typeof options) {
    cb = options;
    options = {};
  }

  if (!options) {
    options = {};
    cb = function(){};
  }

  var req = request
  .post(this.url('keys', key))
  .type('form')
  .send({ value: value });

  if (options.ttl) req.send({ ttl: options.ttl })
  if (options.prev) req.send({ prevValue: options.prev });

  return req.end(this.reply(cb));;
};


/**
 * Watch.
 *
 * @param {String} key
 * @param {Function} cb
 * @return {Client}
 * @public
 */

Client.prototype.watch = function (key, cb) {
  return request
  .get(this.url('watch', key))
  .end(this.reply(cb));
};

/**
 * Endpoint utility.
 *
 * @return {String}
 * @private
 */

Client.prototype.url = function () {
  var route = [].slice.call(arguments).join('/');
  var protocol = this.ssl ? 'https://' : 'http://';
  return protocol
    + this.host
    + ':'
    + this.port
    + '/'
    + this.version
    + '/'
    + route;
};

/**
 * Reply utility.
 *
 * @param {Function} cb
 * @return {Function}
 * @private
 */

Client.prototype.reply = function (cb) {
  cb = cb || noop;
  return function (err, res) {
    if (err) return cb(err);

    if (res.error) {
      err = utils.error(res.text);
      debug('response error - %s', res.text);
      return cb(err.ignore ? err : null, {});
    }

    debug('response - %s', res.text);
    cb(null, JSON.parse(res.text));
  };
};

/**
 * Noop.
 */

function noop(){}

/**
 * Export as a singleton w/ defaults.
 */

module.exports = new Client();
