import path from 'path';

import Evaluator from 'stylus/lib/visitor/evaluator';

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

async function getDependencies(
  code,
  filepath,
  loaderContext,
  webpackFileResolver,
  webpackGlobResolver,
  options,
  seen = new Set()
) {
  seen.add(filepath);

  nodes.filename = filepath;

  const parser = new Parser(code, options);
  const ast = parser.parse();
  const deps = new Map();

  class ImportVisitor extends DepsResolver {
    // eslint-disable-next-line class-methods-use-this
    visitImport(imported) {
      const importedPath = imported.path.first.string;

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
          deps.set(
            importedPath,
            Promise.resolve().then(async () => {
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

              // eslint-disable-next-line no-console
              console.log({
                globRoot,
                parsedGlob,
              });

              return `${globRoot}/${parsedGlob.glob}`;
            })
          );

          return;
        }
      }

      deps.set(
        importedPath,
        resolveFilename(
          importedPath,
          loaderContext.rootContext,
          loaderContext,
          webpackFileResolver,
          webpackGlobResolver
        )
      );
    }
  }

  new ImportVisitor(ast, options).visit(ast);

  // Recursively process depdendencies, and return a map with all resolved paths.
  const res = new Map();

  await Promise.all(
    Array.from(deps.entries()).map(async (result) => {
      let [importedPath, resolved] = result;

      try {
        resolved = await resolved;
      } catch (err) {
        resolved = null;
      }

      if (typeof importedPath === 'undefined') {
        return;
      }

      let found;

      if (resolved) {
        found = Array.isArray(resolved) ? resolved : [resolved];
        res.set(importedPath, resolved);
      } else {
        // support optional .styl
        const originalPath = importedPath;
        if (!/\.styl$/i.test(importedPath)) {
          importedPath += '.styl';
        }

        const paths = (options.paths || []).concat(
          path.dirname(filepath || '.')
        );

        found = utils.find(importedPath, paths, filepath);

        if (!found) {
          found = utils.lookupIndex(originalPath, paths, filepath);
        }

        if (!found) {
          return;
        }
      }

      if (resolved && fastGlob.isDynamicPattern(resolved)) {
        if (!isDirectory(loaderContext.fs, resolved)) {
          found = await fastGlob(resolved);
          found = found.filter((file) => /\.styl$/i.test(file));
        }
      }

      // Recursively process resolved files as well to get nested deps
      for await (const detected of found) {
        if (!seen.has(detected)) {
          let source;

          try {
            source = (await readFile(loaderContext.fs, detected)).toString();
          } catch (error) {
            loaderContext.emitError(error);
          }

          for (const [importPath, resolvedPath] of await getDependencies(
            source,
            detected,
            loaderContext,
            webpackFileResolver,
            webpackGlobResolver,
            options
          )) {
            res.set(importPath, resolvedPath);
          }
        }
      }
    })
  );

  return res;
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

  const possibleImports = (
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
    )
  ).reduce((acc, map) => {
    acc.push(...map);
    return acc;
  }, []);

  const deps = new Map(possibleImports);

  return class CustomEvaluator extends Evaluator {
    visitImport(imported) {
      this.return += 1;

      const node = this.visit(imported.path).first;
      const nodePath = node.string;

      this.return -= 1;

      if (node.name !== 'url' && nodePath && !URL_RE.test(nodePath)) {
        const resolved = deps.get(nodePath);

        if (resolved) {
          node.string = resolved;
        }
      }

      return super.visitImport(imported);
    }
  };
}
