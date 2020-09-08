import path from 'path';

import Evaluator from 'stylus/lib/visitor/evaluator';

import { urlToRequest } from 'loader-utils';
import Parser from 'stylus/lib/parser';
import DepsResolver from 'stylus/lib/visitor/deps-resolver';
import nodes from 'stylus/lib/nodes';
import utils from 'stylus/lib/utils';
import { readFile } from './utils';

const URL_RE = /^(?:url\s*\(\s*)?['"]?(?:[#/]|(?:https?:)?\/\/)/i;

async function resolveFilename(filename, currentDirectory, loaderContext) {
  const resolve = loaderContext.getResolve({
    conditionNames: ['styl', 'style'],
    mainFields: ['styl', 'style', 'main', '...'],
    mainFiles: ['index', '...'],
    extensions: ['.styl', '.css'],
  });

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
  loaderContext,
  resolve,
  options,
  parcelOptions,
  seen = new Set()
) {
  const filepath = loaderContext.resourcePath;

  seen.add(filepath);

  nodes.filename = filepath;

  const parser = new Parser(code, options);
  const ast = parser.parse();
  const deps = new Map();

  class ImportVisitor extends DepsResolver {
    async visitImport(imported) {
      const importedPath = imported.path.first.string;

      if (!deps.has(importedPath)) {
        deps.set(
          importedPath,
          resolve(importedPath, loaderContext.rootContext, loaderContext)
        );
      }
    }
  }

  new ImportVisitor(ast, options).visit(ast);

  // Recursively process depdendencies, and return a map with all resolved paths.
  const res = new Map();

  await Promise.all(
    Array.from(deps.entries()).map(async ([importedPath, resolved]) => {
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
          throw new Error(`failed to locate file ${originalPath}`);
        }
      }

      // Recursively process resolved files as well to get nested deps
      for (const resolved of found) {
        if (!seen.has(resolved)) {
          // await asset.addIncludedFile({ filePath: resolved });

          let code;

          try {
            code = (await readFile(loaderContext.fs, resolved)).toString();
          } catch (error) {
            loaderContext.emitError(error);
          }

          for (const [path, resolvedPath] of await getDependencies(
            code,
            loaderContext,
            resolveFilename,
            options
          )) {
            res.set(path, resolvedPath);
          }
        }
      }
    })
  );

  return res;
}

export default async function createEvaluator(code, options, loaderContext) {
  let optionsImports = '';

  if (options.import) {
    optionsImports = options.import
      .map((entry) => `@import "${entry}";`)
      .join('\n');
  }

  const possibleImports = (
    await Promise.all(
      [code, optionsImports].map((code) =>
        getDependencies(code, loaderContext, resolveFilename, options)
      )
    )
  ).reduce((acc, map) => {
    acc.push(...map);
    return acc;
  }, []);

  const deps = new Map(possibleImports);

  return class CustomEvaluator extends Evaluator {
    visitImport(imported) {
      const node = this.visit(imported.path).first;
      const path = node.string;

      if (node.name !== 'url' && path && !URL_RE.test(path)) {
        const resolved = deps.get(path);

        if (resolved) {
          node.string = resolved;
        }
      }

      return super.visitImport(imported);
    }
  };
}
