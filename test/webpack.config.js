// Just run "webpack-dev-server"

var path = require('path');

function plugin() {
  return function(style) {
    style.define('add', function(a, b) {
      return a.operate('+', b);
    });
  };
}

function includePlugin() {
  return function(style) {
    style.include(path.join(__dirname, 'fixtures', 'include'));
  };
}

if (process.env.WEBPACK_VERSION === '2.1.0-beta.7') {
  module.exports = {
    context: __dirname,
    entry: 'mocha-loader!./all.js',
    resolve: {
      enforceExtensions: false,
      extensions: [
        '.js',
        '.css',
        '.styl'
      ]
    },
    stylus: {
      use: [
        plugin(),
        includePlugin()
      ]
    }
  };
} else {
  module.exports = {
    context: __dirname,
    entry: "mocha-loader!./all.js",
    resolve: {
      extensions: ["", ".js", ".css", ".styl"]
    },
    stylus: {
      use: [plugin(), includePlugin()]
    }
  };
}
