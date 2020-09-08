// A little odd but benchmarkjs evals its tests to make more reliable sampling
// of performance. This is unneccessary for such a large thing like webpack +
// stylus-loader but benchmark already handles a lot of math around
// benchmarking so we are using it currrently. The eval does lead to needing to
// pass some values through the global context.
global.fs = require('fs');

var Benchmark = require('benchmark');
var webpack = require('webpack');
var MemoryFileSystem = require('webpack-dev-server/node_modules/webpack-dev-middleware/node_modules/memory-fs');
var when = require('when');

var importWebpackConfig = require('./fixtures/imports/webpack.config');

function resolveOnComplete(fn) {
  return function () {
    var _this = this;
    var args = arguments;
    return when.promise(function (resolve) {
      var result = fn.apply(_this, args);
      result.on('complete', function () {
        resolve();
      });
    });
  };
}

when
  .resolve()
  .then(
    resolveOnComplete(function () {
      var suite = new Benchmark.Suite();
      suite
        .add('imports', {
          defer: true,
          fn: function (deferred) {
            var compiler = webpack(importWebpackConfig, function (
              error,
              stats
            ) {
              deferred.resolve();
            });
            compiler.outputFileSystem = new MemoryFileSystem();
          },
        })
        .on('cycle', function (event) {
          console.log(String(event.target));
        })
        .run({ async: true });
      return suite;
    })
  )
  .then(
    resolveOnComplete(function () {
      global.n = 0;
      global.dirname = __dirname;
      global.done = function () {};
      var suite = new Benchmark.Suite()
        .add('lr imports', {
          defer: true,
          fn: function (deferred) {
            try {
              global.done = function () {
                global.done = function () {};
                deferred.resolve();
              };
              global.n++;
              global.fs.writeFile(
                global.dirname + '/fixtures/imports/aa.styl',
                ['.aa {', '  color: #aaa;', '}', n % 2 == 0 ? '' : ' '].join(
                  '\n'
                ),
                function (error) {
                  global.compiler.run(function () {
                    (done || global.done)();
                  });
                }
              );
            } catch (error) {
              console.log(error);
            }
          },
        })
        // add listeners
        .on('error', console.error.bind(console))
        .on('cycle', function (event) {
          console.log(String(event.target));
        });

      var webpackConfig = Object.create(importWebpackConfig);
      webpackConfig.watch = true;
      webpackConfig.keepAlive = true;
      webpackConfig.catch = true;
      var compiler = (global.compiler = webpack(webpackConfig));
      compiler.outputFileSystem = new MemoryFileSystem();
      done = function () {
        done = null;
        suite.run({ async: true });
      };
      compiler.run(function () {
        (done || global.done || function () {})();
      });

      return suite;
    })
  )
  .then(function () {
    fs.writeFile(
      __dirname + '/fixtures/imports/aa.styl',
      ['.aa {', '  color: #aaa;', '}', ''].join('\n')
    );
  });
