import path from 'path';

import stylus from 'stylus';

import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import schema from './options.json';
import createEvaluator from './evaluator';
import { getStylusOptions, readFile, normalizeSourceMap } from './utils';
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
      comment: false,
      sourceRoot: this.rootContext,
      basePath: this.rootContext,
    };
  }

  let data = source;

  if (typeof options.additionalData !== 'undefined') {
    data =
      typeof options.additionalData === 'function'
        ? `${options.additionalData(data, this)}`
        : `${options.additionalData}\n${data}`;
  }

  const styl = stylus(data, stylusOptions);

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

  if (stylusOptions.resolveUrl !== false) {
    stylusOptions.resolveUrl = {
      paths: options.paths,
      nocheck: stylusOptions.resolveUrl.noCheck,
    };

    styl.define('url', resolver(stylusOptions.resolveUrl));
  }

  if (typeof stylusOptions.define !== 'undefined') {
    const definitions = Array.isArray(stylusOptions.define)
      ? stylusOptions.define
      : Object.entries(stylusOptions.define);

    for (const defined of definitions) {
      styl.define(...defined);
    }
  }

  // include regular CSS on @import
  if (stylusOptions.includeCSS) {
    styl.set('include css', true);
  }

  const shouldUseWebpackImporter =
    typeof options.webpackImporter === 'boolean'
      ? options.webpackImporter
      : true;

  if (shouldUseWebpackImporter) {
    styl.set('Evaluator', await createEvaluator(source, stylusOptions, this));
  }

  // keep track of imported files (used by Stylus CLI watch mode)
  // eslint-disable-next-line no-underscore-dangle
  stylusOptions._imports = [];

  // let stylus do its magic
  styl.render(async (error, css) => {
    if (error) {
      if (error.filename) {
        this.addDependency(path.normalize(error.filename));
      }

      callback(error);

      return;
    }

    // eslint-disable-next-line no-underscore-dangle
    if (stylusOptions._imports.length > 0) {
      // eslint-disable-next-line no-underscore-dangle
      for (const importData of stylusOptions._imports) {
        this.addDependency(path.normalize(importData.path));
      }
    }

    let map = styl.sourcemap;

    if (map && useSourceMap) {
      map = normalizeSourceMap(map, this.rootContext);

      try {
        map.sourcesContent = await Promise.all(
          map.sources.map(async (file) =>
            (await readFile(this.fs, file)).toString()
          )
        );
      } catch (fsError) {
        callback(fsError);

        return;
      }
    }

    callback(null, css, map);
  });
}
