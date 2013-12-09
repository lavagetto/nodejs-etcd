/**
 * Dependencies.
 */

var utils = require('./utils')
var request = require('request')
var debug = require('debug')('etcd-node')

/**
 * Initialize a new client.
 *
 * @see configure()
 */

function Client(opts) {
  this.version = 'v2'
  this.configure(opts || {})
}



Client.prototype.generator = require('./result').handle_generator


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
  //TODO: validate the url?
  this.baseurl = settings.url + '/' + this.version
  //TODO: add ssl client certificate support.
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
  // by default, just log to console the result.
  cb = callback || this.generator()
  var blocking = ('blocking' in options) && options.blocking
  delete options.blocking
  url = this.url('keys', options.key)
  delete options.key
  if (blocking) {
    //TODO: make a syncronoush http call in this case.
  }
  request(url, options, cb)
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
  return request.get(this.url('machines'), cb)
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
  return request.get(this.url('leader'), cb)
};


/**
* Read.
*
* @param {Object} options
* @return {Object}
* @public
*/

Client.prototype.read = function (options, cb) {
  if (!options) options = {}

  var opts = {}
  opts.method = 'GET'
  opts.key = options.key || '/'

  opts.qs = {}
  if ('recursive' in options) opts.qs.recursive = options.recursive
  if ('wait' in options) opts.qs.wait = options.wait
  if ('wait_index' in options) opts.qs.waitIndex = options.wait_index

  return this._call(opts, cb)
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
  return this.read({'key': key}, cb)
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
  var opts = {'method': 'DELETE'}
  opts.key = options.key

  if ('recursive' in options) opts.recursive = options.recursive
  // Still unsupported, but they may work soon.
  if ('prev_value' in options) opts.prevValue = options.prev_value
  if ('prev_index' in options) opts.prevIndex = options.prev_index
  return this._call(opts, cb)
};


/**
 * Write.
 *
 * @param {Object} options
 * @param {Function} cb
 * @return {Mixed}
 * @public
 */

Client.prototype.write = function (options, cb) {
  var opts = {'method': 'PUT'}
  opts.key = options.key || '/'
  opts.form = {'value': options.value}

  if ('ttl' in options) opts.form.ttl = options.ttl
  if ('prev_exists' in options) opts.form.prevExists = options.prev_exists
  if ('prev_index' in options) opts.form.prevIndex = options.prev_index
  if ('prev_value' in options) opts.form.prevValue = options.prev_value

  return this._call(opts, cb)
}


/**
 * Endpoint utility.
 *
 * @return {String}
 * @private
 */

Client.prototype.url = function () {
  var route = [].slice.call(arguments).join('/').replace('//','/')
  return this.baseurl + '/' + route
};



module.exports = Client
