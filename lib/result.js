function EtcdResult(data) {
  this.fetch(data)
}


EtcdResult.prototype.fetch = function (data) {
  // support changes in the api. gotta love them developers...
  if ('node' in data) {
    this.fetch_v2(data)
  } else{
    if (data.dir) {
      this.nodes = data.kvs
      delete data.kvs
    }
    for (k in data) {
      this[k] = data[k]
    }
  }
}

EtcdResult.prototype.fetch_v2 = function (data) {
  this.action = data.action
  for (k in data.node) {
    this[k] = data.node[k]
  }
}

EtcdResult.prototype.getChildren = function () {
  var res = {}
  if (! this.dir) {
    return res
  }
  for (i=0; i < this.nodes.length; i++) {
    if (this.nodes[i].dir) continue
    var key = this.nodes[i].key
    var value = this.nodes[i].value
    res[key] = value
  }
  return res
}




function noop(obj){
  console.log('###')
  console.log('Action: ' + obj.action)
  if (obj.dir) {
    console.log('Directory: ' + obj.key)
  } else {
    console.log('Key: ' + obj.key)
    console.log('Value: ' + obj.value)
  }
  console.log('Index: ' + obj.modifiedIndex)
  console.log('###')
}

exports.handle_generator = function (err_cb, resp_cb) {
  var exc = err_cb || noop
  var resp = resp_cb || noop
  return function (error, response, body) {
    if (error) {
      console.log('An error occured when trying to execute your request')
      return exc(error)
    }
    if (response.statusCode == 200 || response.statusCode == 201) {
      //this response was ok
      var container = {}
      var data = JSON.parse(body)
      var result = new EtcdResult(data)
      if (response.statusCode == 201) result.new_key = true
      resp(result)
    } else {
      var json = JSON.parse(body);
      var error = new Error(json.message);

      error.code = json.code;
      error.cause = json.cause;

      resp(error);
    }
  }
}
