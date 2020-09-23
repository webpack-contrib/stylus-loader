import { parse } from 'url';
import path from 'path';

import { klona } from 'klona/full';
import { Compiler, nodes, utils } from 'stylus';

function getStylusOptions(loaderContext, loaderOptions) {
  const stylusOptions = klona(
    typeof loaderOptions.stylusOptions === 'function'
      ? loaderOptions.stylusOptions(loaderContext) || {}
      : loaderOptions.stylusOptions || {}
  );

  stylusOptions.filename = loaderContext.resourcePath;

  // Keep track of imported files (used by Stylus CLI watch mode)
  // eslint-disable-next-line no-underscore-dangle
  stylusOptions._imports = [];

  stylusOptions.resolveUrl =
    typeof stylusOptions.resolveUrl === 'boolean' && !stylusOptions.resolveUrl
      ? false
      : typeof stylusOptions.resolveUrl === 'object'
      ? stylusOptions.resolveUrl
      : {};

  return stylusOptions;
}

function urlResolver(options = {}) {
  function resolver(url) {
    const compiler = new Compiler(url);
    const { filename } = url;

    compiler.isURL = true;

    // eslint-disable-next-line no-param-reassign
    const visitedUrl = url.nodes.map((node) => compiler.visit(node)).join('');
    const splitted = visitedUrl.split('!');

    // eslint-disable-next-line no-param-reassign
    url = parse(splitted.pop());

    // Parse literal
    const literal = new nodes.Literal(`url("${url.href}")`);
    let { pathname } = url;
    let { dest } = this.options;
    let tail = '';
    let res;

    // Absolute or hash
    if (url.protocol || !pathname || pathname[0] === '/') {
      return literal;
    }

    // Check that file exists
    if (!options.nocheck) {
      // eslint-disable-next-line no-underscore-dangle
      const _paths = options.paths || [];

      pathname = utils.lookup(pathname, _paths.concat(this.paths));

      if (!pathname) {
        return literal;
      }
    }

    if (this.includeCSS && path.extname(pathname) === '.css') {
      return new nodes.Literal(url.href);
    }

    if (url.search) {
      tail += url.search;
    }

    if (url.hash) {
      tail += url.hash;
    }

    if (dest && path.extname(dest) === '.css') {
      dest = path.dirname(dest);
    }

    res =
      path.relative(
        dest || path.dirname(this.filename),
        options.nocheck ? path.join(path.dirname(filename), pathname) : pathname
      ) + tail;

    if (path.sep === '\\') {
      res = res.replace(/\\/g, '/');
    }

    splitted.push(res);

    return new nodes.Literal(`url("${splitted.join('!')}")`);
  }

  resolver.options = options;
  resolver.raw = true;

  return resolver;
}

function readFile(inputFileSystem, filepath) {
  return new Promise((resolve, reject) => {
    inputFileSystem.readFile(filepath, (error, stats) => {
      if (error) {
        reject(error);
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

function isDirectory(inputFileSystem, filePath) {
  let stats;

  try {
    stats = inputFileSystem.statSync(filePath);
  } catch (ignoreError) {
    return false;
  }

  return stats.isDirectory();
}

export {
  getStylusOptions,
  urlResolver,
  readFile,
  normalizeSourceMap,
  isDirectory,
};
