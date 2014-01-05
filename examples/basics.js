process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
var etcd = require('..');
var sleep = require('sleep')

e = new etcd({ url: 'http://localhost:4001'})


//basic example, *can* run into race conditions.
e
.write({key:'/foo/example', value:'hi'})
.read({key:'/foo/example'});

e.write({key:'/foo/example2', value:'there'})


//now try to create a valid callback structure to handle the etcd response.

var set_config =   function (result) {
  if ('errorCode' in result)
    console.log(result)
  else {
    global.config = result.getChildren()
    console.log('config set!')
    console.log(global.config)
  }
}

var set_config_and_exit = e.generator(
  function () { console.log(arguments)},
  set_config
)

var watch_endpoint = function (cb) {
    e.read(
      {key: '/foo', recursive: true, wait: true},
      cb
    )
}


var set_config_and_watch = e.generator(
  function () { console.log(arguments)},
  function (result) {
    if (result.action == 'get') {
      set_config(result)
    } else {
      e.read({key: '/foo', recursive: true}, set_config_and_exit)
    }
    watch_endpoint(set_config_and_watch)
  }
)


// this will sit forever waiting for changes in the /foo dir and changing global.config for you.
// Note that no recursive call is made here as all calls to set_config_and_watch
// are done via callback, hence from the event loop itself and not from the calling function.
console.log('We will run forever now waiting for changes to happen in the config...')
e
.read(
  {
    key: '/foo',
    recursive: true
  },
  set_config_and_watch
)

e
.write({key:'/foo/example3', value:'meoww2'},
       function () {
         sleep.sleep(10);
         e.del({key:'/foo/example2'});
         console.log(global.config);
       })
