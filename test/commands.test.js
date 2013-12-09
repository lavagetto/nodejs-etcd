var etcd = require('..')
var should = require('should')
var e = new etcd({url: 'http://localhost:4001'})
describe('Commands', function () {

  describe('SET', function () {
    it('should set key with value', function (done) {
      e.write(
        {key: '/hello', value: 'world'},
        e.generator(
          function () { should.not.exist(arguments); done()},
          function (result) {
            result.should.have.property('key', '/hello');
            result.should.have.property('action', 'set');
            result.should.have.property('value', 'world');
            done();
          }
        )
      );
    });

    it('should set a key with ttl', function (done) {
      e.write(
        {key: '/hi', value: 'there', ttl: 10},
        e.generator(
          function () { should.not.exist(arguments); done()},
          function (result) {
            result.should.have.property('key', '/hi');
            result.should.have.property('action', 'set');
            result.should.have.property('ttl', 10);
            done();
          }

        )
      )
    });
  });


  describe('GET', function () {
    it('should get key with value', function (done) {
      e.write({ key: '/hi', value: 'bye'}, function () {
        e.read(
          {key: '/hi'},
          e.generator(
            function () { should.not.exist(arguments); done()},
            function (result) {
              result.should.have.property('key', '/hi');
              result.should.have.property('action', 'get');
              result.should.have.property('value', 'bye');
              done();
            }
          )
        );
      });
    });
  });

  describe('DEL', function () {
    it('should delete key', function (done) {
      e.write(
        { key: '/yoo', value: 'bye'},
        function () {
          e.del('/yoo',
                e.generator(
                  function () { should.not.exist(arguments); done()},
                  function (result) {
                    result.should.have.property('action', 'delete');
                    result.should.have.property('key', '/yoo');
                    result.should.have.property('prevValue', 'bye');
                    done();
                  }
                )
               )
        });
    });
  });

});

/**
 * Little utility.
 */

function times(n, fn) {
  return function () {
    --n || fn.apply(null, arguments);
  };
}
