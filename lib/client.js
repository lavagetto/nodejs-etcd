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
 *
 * @param {Object} opts
 * @return {Client}
 * @public
 */

Client.prototype.configure = function (settings) {
  this.host = settings.host || '127.0.0.1';
  this.port = settings.port || 4001;
  this.ssl = false;
  if ('scheme' in settings) {
    this.ssl = settings.scheme == 'https';
  }

  debug('configure - port:%s', this.port);
  debug('configure - host:%s', this.host);
  debug('configure - ssl:%s', this.ssl);

  return this;
};


/**
* Internal method for calling the server.
*
* @param {Object} options
* @param {Function} cb
* @return {Object}
* @private
*
*/
Client.prototype._call = function (options, callback) {
  options.url = this.url('keys', options.key);
  delete options.key;
  return request(options, callback);
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

Client.prototype.del = function (options, cb) {
  var opts = {'method': 'DELETE'};
  opts.key = key;
  if ('recursive' in options) opts.recursive = options.recursive;
  // Still unsupported, but they may work soon.
  if ('prev_value' in options) opts.prevValue = options.prev_value;
  if ('prev_index' in options) opts.prevIndex = options.prev_index;
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

Client.prototype.list = function (prefix) {
  return this.read({'key': prefix,  'recursive': true});
};

/**
 * Write.
 *
 * @param {Object} options
 * @param {Function} cb
 * @return {Mixed}
 * @public
 */

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

Client.prototype.set = function (key, value, options,cb) {
  if (cb != undefined) {
    opts = options;
  } else {
    cb = options;
    opts = {};
  }
  opts.key = key;
  opts.value = value;
  return this.write(opts, cb)
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
