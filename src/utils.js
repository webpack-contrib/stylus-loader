import { parse } from 'url';
import path from 'path';

import { Parser, Compiler, Evaluator, nodes, utils } from 'stylus';
import DepsResolver from 'stylus/lib/visitor/deps-resolver';
import { urlToRequest } from 'loader-utils';
import { klona } from 'klona/full';
import fastGlob from 'fast-glob';
import normalizePath from 'normalize-path';

function isProductionLikeMode(loaderContext) {
  return loaderContext.mode === 'production' || !loaderContext.mode;
}

function getStylusOptions(loaderContext, loaderOptions) {
  const stylusOptions = klona(
    typeof loaderOptions.stylusOptions === 'function'
      ? loaderOptions.stylusOptions(loaderContext) || {}
      : loaderOptions.stylusOptions || {}
  );

  stylusOptions.filename = loaderContext.resourcePath;
  stylusOptions.dest = path.dirname(loaderContext.resourcePath);

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

  if (!stylusOptions.compress && isProductionLikeMode(loaderContext)) {
    stylusOptions.compress = true;
  }

  return stylusOptions;
}

function getPossibleRequests(loaderContext, filename) {
  const request = urlToRequest(
    filename,
    // eslint-disable-next-line no-undefined
    filename.charAt(0) === '/' ? loaderContext.rootContext : undefined
  );

  return [...new Set([request, filename])];
}

async function resolveFilename(
  loaderContext,
  fileResolver,
  globResolver,
  isGlob,
  context,
  filename
) {
  const possibleRequests = getPossibleRequests(loaderContext, filename);

  let result;

  try {
    result = await resolveRequests(context, possibleRequests, fileResolver);
  } catch (error) {
    if (isGlob) {
      const [globTask] = fastGlob.generateTasks(filename);

      if (globTask.base === '.') {
        throw new Error(
          'Glob resolving without a glob base ("~**/*") is not supported, please specify a glob base ("~package/**/*")'
        );
      }

      const possibleGlobRequests = getPossibleRequests(
        loaderContext,
        globTask.base
      );

      let globResult;

      try {
        globResult = await resolveRequests(
          context,
          possibleGlobRequests,
          globResolver
        );
      } catch (globError) {
        throw globError;
      }

      loaderContext.addContextDependency(globResult);

      const patterns = filename.replace(
        new RegExp(`^${globTask.base}`),
        normalizePath(globResult)
      );

      const paths = await fastGlob(patterns, {
        absolute: true,
        cwd: globResult,
      });

      return paths.sort().filter((file) => /\.styl$/i.test(file));
    }

    throw error;
  }

  return result;
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

const URL_RE = /^(?:url\s*\(\s*)?['"]?(?:[#/]|(?:https?:)?\/\/)/i;

async function getDependencies(
  resolvedDependencies,
  loaderContext,
  fileResolver,
  globResolver,
  seen,
  code,
  filename,
  options
) {
  seen.add(filename);

  // See https://github.com/stylus/stylus/issues/2108
  const newOptions = klona({ ...options, filename, cache: false });
  const parser = new Parser(code, newOptions);

  let ast;

  try {
    ast = parser.parse();
  } catch (error) {
    loaderContext.emitError(error);

    return;
  }

  const dependencies = [];

  class ImportVisitor extends DepsResolver {
    // eslint-disable-next-line class-methods-use-this
    visitImport(node) {
      let firstNode = node.path.first;

      if (firstNode.name === 'url') {
        return;
      }

      if (!firstNode.val) {
        const evaluator = new Evaluator(ast);

        firstNode = evaluator.visit.call(evaluator, firstNode).first;
      }

      const originalNodePath =
        (!firstNode.val.isNull && firstNode.val) || firstNode.name;
      let nodePath = originalNodePath;

      if (!nodePath) {
        return;
      }

      let found;
      let oldNodePath;

      const literal = /\.css(?:"|$)/.test(nodePath);

      if (!literal && !/\.styl$/i.test(nodePath)) {
        oldNodePath = nodePath;
        nodePath += '.styl';
      }

      const isGlob = fastGlob.isDynamicPattern(nodePath);

      found = utils.find(nodePath, this.paths, this.filename);

      if (found && isGlob) {
        const [globTask] = fastGlob.generateTasks(nodePath);
        const context =
          globTask.base === '.'
            ? path.dirname(this.filename)
            : path.join(path.dirname(this.filename), globTask.base);

        loaderContext.addContextDependency(context);
      }

      if (!found && oldNodePath) {
        found = utils.lookupIndex(oldNodePath, this.paths, this.filename);
      }

      if (found) {
        dependencies.push({
          originalLineno: firstNode.lineno,
          originalColumn: firstNode.column,
          originalNodePath,
          resolved: found.map((item) =>
            path.isAbsolute(item) ? item : path.join(process.cwd(), item)
          ),
        });

        return;
      }

      dependencies.push({
        originalLineno: firstNode.lineno,
        originalColumn: firstNode.column,
        originalNodePath,
        resolved: resolveFilename(
          loaderContext,
          fileResolver,
          globResolver,
          isGlob,
          path.dirname(this.filename),
          originalNodePath
        ),
      });
    }
  }

  new ImportVisitor(ast, newOptions).visit(ast);

  await Promise.all(
    Array.from(dependencies).map(async (result) => {
      let { resolved } = result;

      try {
        resolved = await resolved;
      } catch (ignoreError) {
        // eslint-disable-next-line no-param-reassign
        delete result.resolved;

        // eslint-disable-next-line no-param-reassign
        result.error = ignoreError;

        return;
      }

      const isArray = Array.isArray(resolved);

      // `stylus` returns forward slashes on windows
      // eslint-disable-next-line no-param-reassign
      result.resolved = isArray
        ? resolved.map((item) => path.normalize(item))
        : path.normalize(resolved);

      const dependenciesOfDependencies = [];

      for (const dependency of isArray ? result.resolved : [result.resolved]) {
        // Avoid loop, the file is imported by itself
        if (seen.has(dependency)) {
          return;
        }

        loaderContext.addDependency(dependency);

        dependenciesOfDependencies.push(
          (async () => {
            let dependencyCode;

            try {
              dependencyCode = (
                await readFile(loaderContext.fs, dependency)
              ).toString();
            } catch (error) {
              loaderContext.emitError(error);
            }

            await getDependencies(
              resolvedDependencies,
              loaderContext,
              fileResolver,
              globResolver,
              seen,
              dependencyCode,
              dependency,
              options
            );
          })()
        );
      }

      await Promise.all(dependenciesOfDependencies);
    })
  );

  if (dependencies.length > 0) {
    resolvedDependencies.set(filename, dependencies);
  }
}

function mergeBlocks(blocks) {
  let finalBlock;
  const adding = (item) => {
    finalBlock.push(item);
  };

  for (const block of blocks) {
    if (finalBlock) {
      block.nodes.forEach(adding);
    } else {
      finalBlock = block;
    }
  }

  return finalBlock;
}

async function createEvaluator(loaderContext, code, options) {
  const fileResolve = loaderContext.getResolve({
    conditionNames: ['styl', 'stylus', 'style'],
    mainFields: ['styl', 'style', 'stylus', 'main', '...'],
    mainFiles: ['index', '...'],
    extensions: ['.styl', '.css'],
    restrictions: [/\.(css|styl)$/i],
  });

  const globResolve = loaderContext.getResolve({
    conditionNames: ['styl', 'stylus', 'style'],
    mainFields: ['styl', 'style', 'stylus', 'main', '...'],
    mainFiles: ['index', '...'],
    resolveToContext: true,
  });

  const resolvedImportDependencies = new Map();
  const resolvedDependencies = new Map();
  const seen = new Set();

  await getDependencies(
    resolvedDependencies,
    loaderContext,
    fileResolve,
    globResolve,
    seen,
    code,
    loaderContext.resourcePath,
    options
  );

  const optionsImports = [];

  for (const importPath of options.imports) {
    const isGlob = fastGlob.isDynamicPattern(importPath);

    optionsImports.push({
      importPath,
      resolved: resolveFilename(
        loaderContext,
        fileResolve,
        globResolve,
        isGlob,
        path.dirname(loaderContext.resourcePath),
        importPath
      ),
    });
  }

  await Promise.all(
    optionsImports.map(async (result) => {
      const { importPath } = result;
      let { resolved } = result;

      try {
        resolved = await resolved;
      } catch (ignoreError) {
        return;
      }

      const isArray = Array.isArray(resolved);

      // `stylus` returns forward slashes on windows
      // eslint-disable-next-line no-param-reassign
      result.resolved = isArray
        ? resolved.map((item) => path.normalize(item))
        : path.normalize(resolved);

      resolvedImportDependencies.set(importPath, result);

      const dependenciesOfImportDependencies = [];

      for (const dependency of isArray ? result.resolved : [result.resolved]) {
        dependenciesOfImportDependencies.push(
          (async () => {
            let dependencyCode;

            try {
              dependencyCode = (
                await readFile(loaderContext.fs, dependency)
              ).toString();
            } catch (error) {
              loaderContext.emitError(error);
            }

            await getDependencies(
              resolvedDependencies,
              loaderContext,
              fileResolve,
              globResolve,
              seen,
              dependencyCode,
              dependency,
              options
            );
          })()
        );
      }

      await Promise.all(dependenciesOfImportDependencies);
    })
  );

  return class CustomEvaluator extends Evaluator {
    visitImport(imported) {
      this.return += 1;

      const node = this.visit(imported.path).first;
      const nodePath = (!node.val.isNull && node.val) || node.name;

      this.return -= 1;

      let webpackResolveError;

      if (node.name !== 'url' && nodePath && !URL_RE.test(nodePath)) {
        let dependency;

        const isEntrypoint = loaderContext.resourcePath === node.filename;

        if (isEntrypoint) {
          dependency = resolvedImportDependencies.get(nodePath);
        }

        if (!dependency) {
          const dependencies = resolvedDependencies.get(
            path.normalize(node.filename)
          );

          if (dependencies) {
            dependency = dependencies.find((item) => {
              if (
                item.originalLineno === node.lineno &&
                item.originalColumn === node.column &&
                item.originalNodePath === nodePath
              ) {
                if (item.error) {
                  webpackResolveError = item.error;
                } else {
                  return item.resolved;
                }
              }

              return false;
            });
          }
        }

        if (dependency) {
          const { resolved } = dependency;

          if (!Array.isArray(resolved)) {
            // Avoid re globbing when resolved import contains glob characters
            node.string = fastGlob.escapePath(resolved);
          } else if (resolved.length > 0) {
            let hasError = false;

            const blocks = resolved.map((item) => {
              const clonedImported = imported.clone();
              const clonedNode = this.visit(clonedImported.path).first;

              // Avoid re globbing when resolved import contains glob characters
              clonedNode.string = fastGlob.escapePath(item);

              let result;

              try {
                result = super.visitImport(clonedImported);
              } catch (error) {
                hasError = true;
              }

              return result;
            });

            if (!hasError) {
              return mergeBlocks(blocks);
            }
          }
        }
      }

      let result;

      try {
        result = super.visitImport(imported);
      } catch (error) {
        loaderContext.emitError(
          new Error(
            `Stylus resolver error: ${error.message}${
              webpackResolveError
                ? `\n\nWebpack resolver error: ${webpackResolveError.message}${
                    webpackResolveError.details
                      ? `\n\nWebpack resolver error details:\n${webpackResolveError.details}`
                      : ''
                  }${
                    webpackResolveError.missing
                      ? `\n\nWebpack resolver error missing:\n${webpackResolveError.missing.join(
                          '\n'
                        )}`
                      : ''
                  }`
                : ''
            }`
          )
        );

        return imported;
      }

      return result;
    }
  };
}

function urlResolver(options = {}) {
  function resolver(url) {
    const compiler = new Compiler(url);
    const { filename } = url;

    compiler.isURL = true;

    const visitedUrl = url.nodes.map((node) => compiler.visit(node)).join('');
    const splitted = visitedUrl.split('!');

    const parsedUrl = parse(splitted.pop());

    // Parse literal
    const literal = new nodes.Literal(`url("${parsedUrl.href}")`);
    let { pathname } = parsedUrl;
    let { dest } = this.options;
    let tail = '';
    let res;

    // Absolute or hash
    if (parsedUrl.protocol || !pathname || pathname[0] === '/') {
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
      return new nodes.Literal(parsedUrl.href);
    }

    if (parsedUrl.search) {
      tail += parsedUrl.search;
    }

    if (parsedUrl.hash) {
      tail += parsedUrl.hash;
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
  createEvaluator,
  resolveFilename,
  readFile,
  normalizeSourceMap,
};
