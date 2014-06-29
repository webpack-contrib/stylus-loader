// Just run "webpack-dev-server"
function plugin() {
  return function(style) {
    style.define('add', function(a, b) {
      return a.operate('+', b);
    });
  };
}

module.exports = {
	context: __dirname,
	entry: "mocha-loader!./all.js",
	resolve: {
		extensions: ["", ".js", ".css", ".styl"]
	},
  stylus: {
    use: [plugin()]
  }
};
