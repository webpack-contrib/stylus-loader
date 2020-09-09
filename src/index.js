import { promises as fs } from 'fs';

import stylus from 'stylus';

import clone from 'clone';

import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import schema from './options.json';
import createEvaluator from './evaluator';
import { isObject, castArray } from './utils';
import resolver from './lib/resolver';

export default async function stylusLoader(source) {
  const options = getOptions(this);

  validateOptions(schema, options, {
    name: 'Stylus Loader',
    baseDataPath: 'options',
  });

  const callback = this.async();

  const stylusOptions = clone(options.stylusOptions) || {};

  // access Webpack config
  const webpackConfig =
    this._compilation && isObject(this._compilation.options)
      ? this._compilation.options
      : {};

  // stylus works better with an absolute filename
  stylusOptions.filename = stylusOptions.filename || this.resourcePath;

  // get sourcemap option in the order: options.sourceMap > options.sourcemap > this.sourceMap
  if (options.sourceMap != null) {
    options.sourcemap = options.sourceMap;
  } else if (
    options.sourcemap == null &&
    this.sourceMap &&
    (!webpackConfig.devtool || webpackConfig.devtool.indexOf('eval') !== 0)
  ) {
    options.sourcemap = {};
  }

  // set stylus sourcemap defaults
  if (options.sourcemap) {
    if (!isObject(options.sourcemap)) {
      stylusOptions.sourcemap = {};
    }

    stylusOptions.sourcemap = Object.assign(
      {
        // enable loading source map content by default
        content: true,
        // source map comment is added by css-loader
        comment: false,
        // set sourceRoot for better handling of paths by css-loader
        sourceRoot: this.rootContext,
      },
      options.sourcemap
    );
  }

  // create stylus renderer instance
  const styl = stylus(source, stylusOptions);

  // import of plugins passed as strings
  if (stylusOptions.use.length) {
    for (const [i, plugin] of Object.entries(stylusOptions.use)) {
      if (typeof plugin === 'string') {
        try {
          // eslint-disable-next-line import/no-dynamic-require,global-require
          stylusOptions.use[i] = require(plugin)();
        } catch (err) {
          stylusOptions.use.splice(i, 1);
          err.message = `Stylus plugin '${plugin}' failed to load. Are you sure it's installed?`;
          this.emitWarning(err);
        }
      }
    }
  }

  // add custom include paths
  if ('include' in stylusOptions) {
    castArray(stylusOptions.include).forEach(styl.include, styl);
  }

  // add custom stylus file imports
  if ('import' in stylusOptions) {
    castArray(stylusOptions.import).forEach(styl.import, styl);
  }

  // enable resolver for relative urls
  if (stylusOptions.resolveUrl) {
    if (!isObject(stylusOptions.resolveUrl)) {
      stylusOptions.resolveUrl = {};
    }

    styl.define('url', resolver(stylusOptions));
  }

  // define global variables/functions
  if (isObject(stylusOptions.define)) {
    for (const entry of Object.entries(stylusOptions.define)) {
      styl.define(...entry);
    }
  }

  // include regular CSS on @import
  if (stylusOptions.includeCSS) {
    styl.set('include css', true);
  }

  styl.set('Evaluator', await createEvaluator(source, stylusOptions, this));

  // keep track of imported files (used by Stylus CLI watch mode)
  // eslint-disable-next-line no-underscore-dangle
  stylusOptions._imports = [];

  // let stylus do its magic
  styl.render(async (err, css) => {
    if (err) {
      this.addDependency(err.filename);
      return callback(err);
    }

    // add all source files as dependencies
    // eslint-disable-next-line no-underscore-dangle
    if (stylusOptions._imports.length) {
      // eslint-disable-next-line no-underscore-dangle
      for (const importData of stylusOptions._imports) {
        this.addDependency(importData.path);
      }
    }

    if (styl.sourcemap) {
      // css-loader will set the source map file name
      delete styl.sourcemap.file;

      // load source file contents into source map
      if (stylusOptions.sourcemap && stylusOptions.sourcemap.content) {
        try {
          styl.sourcemap.sourcesContent = await Promise.all(
            styl.sourcemap.sources.map((file) => fs.readFile(file, 'utf-8'))
          );
        } catch (e) {
          return callback(e);
        }
      }
    }

    return callback(null, css, styl.sourcemap);
  });
}
