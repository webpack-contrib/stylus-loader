var Benchmark = require('benchmark');
var webpack = require('webpack');
var MemoryFileSystem = require('webpack-dev-server/node_modules/webpack-dev-middleware/node_modules/memory-fs');

var importWebpackConfig = require('./fixtures/imports/webpack.config');

var suite = new Benchmark.Suite;

// add tests
suite.add('imports', {
  defer: true,
  fn: function(deferred) {
    var compiler = webpack(importWebpackConfig, function(error, stats) {
      if (error) {
        console.error(error);
      }
      // console.log(stats.endTime - stats.startTime);
      deferred.resolve();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
    // /o/.test('Hello World!');
  },
})
// .add('String#indexOf', function() {
//   'Hello World!'.indexOf('o') > -1;
// })
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
// run async
.run({ 'async': true });
