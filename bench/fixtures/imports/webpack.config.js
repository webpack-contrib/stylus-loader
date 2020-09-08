// Just run "webpack-dev-server"
function plugin() {
  return (style) => {
    style.define('add', (a, b) => {
      return a.operate('+', b);
    });
  };
}

module.exports = {
  context: __dirname,
  entry: './index.js',
  output: {
    path: `${__dirname}/tmp`,
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['', '.js', '.css', '.styl'],
  },
  module: {
    loaders: [
      {
        test: /\.styl$/,
        loader: `style-loader!css-loader!${require('path').join(
          __dirname,
          '../../../index'
        )}`,
      },
    ],
  },
  stylus: {
    use: [plugin()],
    // importsCache: false,
  },
};
