# etcd-node

An alternative client library for interacting with etcd from node.js (without coffeescrpt). If you don't mind having coffeescript dependencies, [there is already is a module for that](https://github.com/stianeikeland/node-etcd).

## Notice

This is not stable at all! I am writing this module as I learn more about [etcd](http://coreos.com/docs/guides/etcd/), feel free to [help](https://github.com/gjohnson/etcd-node/issues)!

## Install

```sh
$ npm install etcd
```

## Configuring.

The client is a singleton; however, before using it you need to set the etcd url using the `configure` method.

```js
var etcd = require('etcd');

etcd.configure({
    url: 'https://node01.example.com:4001'
});
```


## Commands

Etcd-js supports the full v2 api specification.

### .write(options, [callback])

Writes a key or dir to the cluster. Simplest form:

```js
etcd.write({
    key: 'hello',
    value: 'world',
    }, function (err,resp, body) {
  if (err) throw err;
  console.log(body);
});
```

All etcd flags to a write operation are supported and must be added to the `options` object.

Accepted options:

- `ttl`` (integer) sets a TTL on the key
- `prev_exists` (boolean) key gets written only if it is being created.
- `prev_index` (integer) sets the key only if the actual index is exactly this one.
- `prev_value` (string) sets the key only if the actual value is this one.


### .read(options, [callback])

Reads from etcd. All paths you may want to read start with '/' as the etcd hierarchy strictly mimics the one of a filesystem

```js
etcd.read({'key': '/hello', function (err, result, body) {
  if (err) throw err;
  assert(result.value);
});
```

All etcd flags are supported here as well; the valid options are:

- `recursive` (boolean) it set to true, fetches all subdirectories
- `wait` (boolean) if set to true, the request will wait until the value changes.
- `wait_index` (integer) if set toghether with wait, will wait to return until the marked index is reached

### .del(options, [callback])

Deletes a key from etcd. If the `recursive` option is set to true, it will allow to remove directories.

```js
etcd.del('hello', function (err) {
  if (err) throw err;
});
```


### .machines(callback)

```js
etcd.machines(function (err, list) {
  if (err) throw err;
});
```

### .leader(callback)

```js
etcd.leader(function (err, host) {
  if (err) throw err;
});
```

## License

MIT
