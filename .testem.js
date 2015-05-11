const path = require('path');

const webpackBin = path.resolve(__dirname, 'node_modules/.bin/webpack-dev-server');
const webpackConfig = ' --config test/webpack.config.js';

module.exports = {
  framework: 'mocha',
  src_files: ['test/**/*', '*.js', 'lib/*.js'],
  on_start: {
    command: webpackBin + ' -d' + webpackConfig,
    wait_for_text: '[emitted]'
  },
  routes: {
    '/mocha': 'node_modules/mocha',
    '/': 'test/index.html'
  },
  proxies: {
    '/bundle.js': {
      'target': 'http://localhost:8080'
    }
  }
};
