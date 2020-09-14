import path from 'path';

import { klona } from 'klona/full';

function getStylusOptions(loaderContext, loaderOptions) {
  const stylusOptions = klona(
    typeof loaderOptions.stylusOptions === 'function'
      ? loaderOptions.stylusOptions(loaderContext) || {}
      : loaderOptions.stylusOptions || {}
  );

  stylusOptions.filename = loaderContext.resourcePath;

  stylusOptions.resolveUrl =
    typeof stylusOptions.resolveUrl === 'boolean'
      ? stylusOptions.resolveUrl
      : true;

  stylusOptions.nocheck =
    typeof stylusOptions.resolveUrlNocheck === 'boolean'
      ? stylusOptions.resolveUrlNocheck
      : false;

  if (
    typeof stylusOptions.use !== 'undefined' &&
    stylusOptions.use.length > 0
  ) {
    for (const [i, plugin] of Object.entries(stylusOptions.use)) {
      if (typeof plugin === 'string') {
        try {
          // eslint-disable-next-line import/no-dynamic-require,global-require
          stylusOptions.use[i] = require(plugin)();
        } catch (err) {
          stylusOptions.use.splice(i, 1);
          err.message = `Stylus plugin '${plugin}' failed to load. Are you sure it's installed?`;
          loaderContext.emitWarning(err);
        }
      }
    }
  }

  return stylusOptions;
}

function readFile(inputFileSystem, filepath) {
  return new Promise((resolve, reject) => {
    inputFileSystem.readFile(filepath, (err, stats) => {
      if (err) {
        reject(err);
      }
      resolve(stats);
    });
  });
}

const IS_NATIVE_WIN32_PATH = /^[a-z]:[/\\]|^\\\\/i;
const ABSOLUTE_SCHEME = /^[A-Za-z0-9+\-.]+:/;

function getURLType(source) {
  if (source[0] === '/') {
    if (source[1] === '/') {
      return 'scheme-relative';
    }

    return 'path-absolute';
  }

  if (IS_NATIVE_WIN32_PATH.test(source)) {
    return 'path-absolute';
  }

  return ABSOLUTE_SCHEME.test(source) ? 'absolute' : 'path-relative';
}

function normalizeSourceMap(map, rootContext) {
  const newMap = map;

  // result.map.file is an optional property that provides the output filename.
  // Since we don't know the final filename in the webpack build chain yet, it makes no sense to have it.
  // eslint-disable-next-line no-param-reassign
  delete newMap.file;

  // eslint-disable-next-line no-param-reassign
  newMap.sourceRoot = '';

  // eslint-disable-next-line no-param-reassign
  newMap.sources = newMap.sources.map((source) => {
    const sourceType = getURLType(source);

    // Do no touch `scheme-relative`, `path-absolute` and `absolute` types
    if (sourceType === 'path-relative') {
      return path.resolve(rootContext, path.normalize(source));
    }

    return source;
  });

  return newMap;
}

export { getStylusOptions, readFile, normalizeSourceMap };
