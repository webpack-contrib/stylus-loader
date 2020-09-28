import { parse } from 'url';
import path from 'path';

import { Compiler, nodes, utils } from 'stylus';
import { urlToRequest } from 'loader-utils';
import { klona } from 'klona/full';
import fastGlob from 'fast-glob';

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

  // https://github.com/stylus/stylus/issues/2119
  stylusOptions.resolveURL =
    typeof stylusOptions.resolveURL === 'boolean' && !stylusOptions.resolveURL
      ? false
      : typeof stylusOptions.resolveURL === 'object'
      ? stylusOptions.resolveURL
      : { nocheck: true };

  return stylusOptions;
}

async function runGlob(patterns, options) {
  const paths = await fastGlob(patterns, { absolute: true, ...options });

  return paths.sort().filter((file) => /\.styl$/i.test(file));
}

async function resolveFilename(
  loaderContext,
  webpackFileResolver,
  webpackGlobResolver,
  context,
  filename
) {
  const isGlob = fastGlob.isDynamicPattern(filename);
  const resolve = isGlob ? webpackGlobResolver : webpackFileResolver;

  let parsedGlob;

  if (isGlob) {
    [parsedGlob] = fastGlob.generateTasks(filename);

    // eslint-disable-next-line no-param-reassign
    filename = parsedGlob.base === '.' ? context : parsedGlob.base;
  }

  const request = urlToRequest(
    filename,
    // eslint-disable-next-line no-undefined
    filename.charAt(0) === '/' ? loaderContext.rootContext : undefined
  );
  const possibleRequests = [...new Set([request, filename])];

  return resolveRequests(context, possibleRequests, resolve)
    .then(async (result) => {
      if (isGlob && result) {
        loaderContext.addContextDependency(result);

        const patterns = parsedGlob.patterns.map((item) =>
          item.slice(parsedGlob.base.length + 1)
        );

        return runGlob(patterns, { cwd: result });
      }

      return result;
    })
    .catch((error) => {
      if (isGlob) {
        return resolveRequests(context, possibleRequests, webpackFileResolver);
      }

      throw error;
    });
}

function resolveRequests(context, possibleRequests, resolve) {
  if (possibleRequests.length === 0) {
    return Promise.reject();
  }

  return resolve(context, possibleRequests[0])
    .then((result) => {
      return result;
    })
    .catch((error) => {
      const [, ...tailPossibleRequests] = possibleRequests;

      if (tailPossibleRequests.length === 0) {
        throw error;
      }

      return resolveRequests(context, tailPossibleRequests, resolve);
    });
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

export {
  getStylusOptions,
  urlResolver,
  resolveFilename,
  readFile,
  normalizeSourceMap,
};
