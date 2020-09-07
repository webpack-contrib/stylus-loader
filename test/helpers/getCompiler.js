import path from 'path';

import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';

import { OptionsPlugin } from '../../src';

export default (fixture, loaderOptions = {}, config = {}) => {
  const fullConfig = {
    mode: 'development',
    devtool: config.devtool || false,
    context: path.resolve(__dirname, '../fixtures'),
    entry: path.resolve(__dirname, '../fixtures', fixture),
    output: {
      path: path.resolve(__dirname, '../outputs'),
      filename: '[name].bundle.js',
      chunkFilename: '[name].chunk.js',
      library: 'stylusLoaderExport',
    },
    module: {
      rules: [
        {
          test: /\.styl$/i,
          rules: [
            {
              loader: require.resolve('./testLoader'),
            },
            {
              loader: path.resolve(__dirname, '../../src'),
              options: loaderOptions || {},
            },
          ],
        },
      ],
    },
    plugins: [
      new OptionsPlugin({
        default: {
          use: [plugin(), includePlugin()],
        },
      }),
    ],
    resolve: {
      extensions: ['.js', '.css', '.styl'],
      modules: [
        'node_modules',
        path.join(__dirname, '../', 'fixtures', 'web_modules'),
      ],
    },
    ...config,
  };

  const compiler = webpack(fullConfig);

  if (!config.outputFileSystem) {
    const outputFileSystem = createFsFromVolume(new Volume());
    // Todo remove when we drop webpack@4 support
    outputFileSystem.join = path.join.bind(path);

    compiler.outputFileSystem = outputFileSystem;
  }

  return compiler;
};

function plugin() {
  return function (style) {
    style.define('add', function (a, b) {
      return a.operate('+', b);
    });
  };
}

function includePlugin() {
  return function (style) {
    style.include(path.join(__dirname, '../', 'fixtures', 'include'));
  };
}
