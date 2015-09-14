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
