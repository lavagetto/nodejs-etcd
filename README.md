# nodejs-etcd

Another (!!) etcd library for nodejs. This is formerly based on etcd-node, but has since evolved to a full-fledged new library with etcd v2 support.

[![NPM](https://nodei.co/npm/nodejs-etcd.png)](https://nodei.co/npm/nodejs-etcd/)

## Notice

This is not stable at the moment. Development will follow closely the development of etcd and changes in its API. minor-version changes will be kept in sync.

## Install

```sh
$ npm install nodejs-etcd
```

## Configuring.

The client only need to be configured very simply by providing the base url of the etcd service.


```js
var etcd = require('nodejs-etcd');

var e = new etcd({
    url: 'https://node01.example.com:4001'
})
```


## Commands

Nodejs-etcd supports the full v2 api specification.

### .read(options, [callback])

Reads from etcd. All paths you may want to read start with '/' as the etcd hierarchy strictly mimics the one of a filesystem

```js
e.read({'key': '/hello'}, function (err, result, body) {
  if (err) throw err;
  assert(result.value);
});
```

All etcd flags are supported here as well; the valid options are:

- `recursive` (boolean) it set to true, fetches all subdirectories
- `wait` (boolean) if set to true, the request will wait until the value changes.
- `wait_index` (integer) if set toghether with wait, will wait to return until the marked index is reached


### .generator(err_cb, resp_cb)

The callback can be encapsulated using this method. It will return a valid callback for the other methods that will:

- Manage HTTP response codes
- Populate a standard `EtcdResult` object (see `result.js`)
- Apply resp_cb to this result.

Let's say we just want to output the value of the key:

```js
cb = e.generator(
    function () { console.log('An error has occurred')},
    function (result) { console.log('We found the key, it has value ' + result.value)}
)
e.read(
    {key: '/hello'},
    cb
)
```
By default, if no callback is declared nodejs-etcd will log some important values of the response to the console.


### .write(options, [callback])

Writes a key or dir to the cluster. Simplest form:

```js
e.write({
    key: 'hello',
    value: 'world',
    }, function (err,resp, body) {
  if (err) throw err;
  console.log(body);
});
```

All etcd flags to a write operation are supported and must be added to the `options` object.

Accepted options:

- `ttl` (integer) sets a TTL on the key
- `dir` (boolean) will write a directory. dont pass a value if this is true.
- `prev_exists` (boolean) key gets written only if it is being created.
- `prev_index` (integer) sets the key only if the actual index is exactly this one.
- `prev_value` (string) sets the key only if the actual value is this one.

### .del(options, [callback])

Deletes a key from etcd. If the `recursive` option is set to true, it will allow to remove directories.

```js
e.del('hello', function (err) {
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
