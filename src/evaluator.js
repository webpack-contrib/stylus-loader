import path from 'path';

import Evaluator from 'stylus/lib/visitor/evaluator';

import normalizePath from 'normalize-path';
import fastGlob from 'fast-glob';
import { urlToRequest } from 'loader-utils';
import Parser from 'stylus/lib/parser';
import DepsResolver from 'stylus/lib/visitor/deps-resolver';
import nodes from 'stylus/lib/nodes';
import utils from 'stylus/lib/utils';

import { readFile, isDirectory } from './utils';

const URL_RE = /^(?:url\s*\(\s*)?['"]?(?:[#/]|(?:https?:)?\/\/)/i;

async function resolveFilename(
  filename,
  currentDirectory,
  loaderContext,
  webpackFileResolver,
  webpackGlobResolver,
  resolveGlob
) {
  const resolve =
    typeof resolveGlob === 'undefined'
      ? webpackFileResolver
      : webpackGlobResolver;

  const request = urlToRequest(
    filename,
    // eslint-disable-next-line no-undefined
    filename.charAt(0) === '/' ? loaderContext.rootContext : undefined
  );

  return resolveRequests(
    currentDirectory,
    [...new Set([request, filename])],
    resolve
  );
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
const seen = new Set();
const resolvedDependencies = new Map();

async function getDependencies(
  code,
  filepath,
  loaderContext,
  webpackFileResolver,
  webpackGlobResolver,
  options
) {
  // options = { ...options, filename: filepath };

  seen.add(filepath);

  nodes.filename = filepath;

  const parser = new Parser(code, options);

  let ast;

  try {
    ast = parser.parse();
  } catch (error) {
    loaderContext.emitError(error);
  }

  const deps = new Map();

  class ImportVisitor extends DepsResolver {
    // eslint-disable-next-line class-methods-use-this
    visitImport(imported) {
      const node = imported.path.first;

      if (node.name === 'url') {
        return;
      }

      const importedPath = (!node.val.isNull && node.val) || node.name;
      let nodePath = importedPath;

      if (!importedPath || deps.has(importedPath)) {
        return;
      }

      if (fastGlob.isDynamicPattern(importedPath)) {
        if (
          !isDirectory(
            loaderContext.fs,
            path.join(path.dirname(filepath), importedPath)
          )
        ) {
          deps.set(importedPath, {
            filename: filepath,
            resolved: Promise.resolve().then(async () => {
              const [parsedGlob] = fastGlob.generateTasks(importedPath);

              parsedGlob.glob =
                parsedGlob.base === '.'
                  ? importedPath
                  : importedPath.slice(parsedGlob.base.length + 1);

              const globRoot = await resolveFilename(
                parsedGlob.base,
                path.dirname(filepath),
                loaderContext,
                webpackFileResolver,
                webpackGlobResolver,
                true
              );

              return {
                isGlob: true,
                path: path.posix.join(globRoot, parsedGlob.glob),
              };
            }),
          });

          return;
        }
      }

      let found;
      let oldPath;

      const literal = /\.css(?:"|$)/.test(nodePath);

      if (!literal && !/\.styl$/i.test(nodePath)) {
        oldPath = nodePath;
        nodePath += '.styl';
      }

      found = utils.find(nodePath, this.paths, this.filename);

      if (!found && oldPath)
        found = utils.lookupIndex(oldPath, this.paths, this.filename);

      if (found) {
        deps.set(importedPath, {
          filename: filepath,
          resolved: path.resolve(
            loaderContext.rootContext,
            path.relative(loaderContext.rootContext, ...found)
          ),
        });

        return;
      }

      deps.set(importedPath, {
        filename: filepath,
        resolved: resolveFilename(
          importedPath,
          path.dirname(filepath),
          loaderContext,
          webpackFileResolver,
          webpackGlobResolver
        ),
      });
    }
  }

  new ImportVisitor(ast, options).visit(ast);

  // Recursively process depdendencies, and return a map with all resolved paths.
  await Promise.all(
    Array.from(deps.entries()).map(async (result) => {
      const [importedPath, importedData] = result;
      let { filename, resolved } = importedData;
      let pathIsGlob;

      try {
        resolved = await resolved;
      } catch (ignoreError) {
        /*
         * The stylus can still resolve the paths obtained with `use` option
         * example `nib`, `bootstrap`, or will generate an error
         * */

        return;
      }

      if (resolved.isGlob) {
        pathIsGlob = true;
        resolved = normalizePath(resolved.path);
      }

      if (!resolvedDependencies.has(filename)) {
        resolvedDependencies.set(filename, []);
      }

      resolvedDependencies.get(filename).push({ importedPath, resolved });

      let found = Array.isArray(resolved) ? resolved : [resolved];

      if (pathIsGlob) {
        found = await fastGlob(resolved);
        found = found.filter((file) => /\.styl$/i.test(file));
      }

      // TODO
      // this.deps = this.deps.concat(found);

      // Recursively process resolved files as well to get nested deps
      const nestedDeps = [];

      for (const detected of found) {
        nestedDeps.push(
          (async () => {
            if (!seen.has(detected)) {
              let source;

              try {
                source = (
                  await readFile(loaderContext.fs, detected)
                ).toString();
              } catch (error) {
                loaderContext.emitError(error);
              }

              // TODO
              // dir = dirname(file)
              // if (!~this.paths.indexOf(dir)) this.paths.push(dir);
              // , block = new nodes.Block

              await getDependencies(
                source,
                detected,
                loaderContext,
                webpackFileResolver,
                webpackGlobResolver,
                options
              );
            }
          })()
        );
      }

      await Promise.all(nestedDeps);
    })
  );
}

export default async function createEvaluator(code, options, loaderContext) {
  const webpackFileResolver = loaderContext.getResolve({
    conditionNames: ['styl', 'stylus', 'style'],
    mainFields: ['styl', 'style', 'stylus', 'main', '...'],
    mainFiles: ['index', '...'],
    extensions: ['.styl', '.css'],
    restrictions: [/\.(css|styl)$/i],
  });

  const webpackGlobResolver = loaderContext.getResolve({
    conditionNames: ['styl', 'stylus', 'style'],
    mainFields: ['styl', 'style', 'stylus', 'main', '...'],
    mainFiles: ['index', '...'],
    resolveToContext: true,
  });

  let optionsImports = '';

  if (options.import) {
    optionsImports = options.import
      .map((entry) => `@import "${entry}";`)
      .join('\n');
  }

  await Promise.all(
    [code, optionsImports].map((content) =>
      getDependencies(
        content,
        loaderContext.resourcePath,
        loaderContext,
        webpackFileResolver,
        webpackGlobResolver,
        options
      )
    )
  );

  return class CustomEvaluator extends Evaluator {
    visitImport(imported) {
      this.return += 1;

      const node = this.visit(imported.path).first;
      const nodePath = node.string;

      this.return -= 1;

      if (node.name !== 'url' && nodePath && !URL_RE.test(nodePath)) {
        let resolvedDeps = resolvedDependencies.get(imported.path.filename);

        resolvedDeps =
          typeof resolvedDeps !== 'undefined'
            ? resolvedDeps.filter((i) => {
                return i.importedPath === nodePath;
              })
            : [];

        if (resolvedDeps.length > 0) {
          node.string = resolvedDeps[0].resolved;
        }
      }

      return super.visitImport(imported);
    }
  };
}
