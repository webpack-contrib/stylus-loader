import { promises as fs } from 'fs';

import stylus from 'stylus';

import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import schema from './options.json';
import createEvaluator from './evaluator';
import { getStylusOptions } from './utils';
import resolver from './lib/resolver';

export default async function stylusLoader(source) {
  const options = getOptions(this);

  validateOptions(schema, options, {
    name: 'Stylus Loader',
    baseDataPath: 'options',
  });

  const callback = this.async();

  const stylusOptions = getStylusOptions(this, options);

  const useSourceMap =
    typeof options.sourceMap === 'boolean' ? options.sourceMap : this.sourceMap;

  if (useSourceMap) {
    stylusOptions.sourcemap = {
      content: true,
      comment: false,
      sourceRoot: this.rootContext,
    };
  }

  const styl = stylus(source, stylusOptions);

  if (typeof stylusOptions.include !== 'undefined') {
    for (const included of stylusOptions.include) {
      styl.include(included);
    }
  }

  if (typeof stylusOptions.import !== 'undefined') {
    for (const imported of stylusOptions.import) {
      styl.import(imported);
    }
  }

  if (typeof stylusOptions.resolveUrl !== 'undefined') {
    stylusOptions.resolveUrl = {};

    styl.define('url', resolver(stylusOptions));
  }

  if (typeof stylusOptions.define !== 'undefined') {
    for (const defined of stylusOptions.define) {
      styl.define(...defined);
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
  styl.render(async (error, css) => {
    if (error) {
      this.addDependency(error.filename);
      return callback(error);
    }

    // eslint-disable-next-line no-underscore-dangle
    if (stylusOptions._imports.length) {
      // eslint-disable-next-line no-underscore-dangle
      for (const importData of stylusOptions._imports) {
        this.addDependency(importData.path);
      }
    }

    if (styl.sourcemap) {
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
