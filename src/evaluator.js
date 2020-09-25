import path from 'path';

import { klona } from 'klona/full';
import { Evaluator, Parser, utils } from 'stylus';
import DepsResolver from 'stylus/lib/visitor/deps-resolver';

import { resolveFilename, readFile } from './utils';

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

  // TODO cache
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

      found = utils.find(nodePath, this.paths, this.filename);

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
          path.dirname(filename),
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

      // eslint-disable-next-line no-param-reassign
      result.resolved = resolved;

      resolved = Array.isArray(resolved) ? resolved : [resolved];

      const dependenciesOfDependencies = [];

      for (const dependency of resolved) {
        // Avoid loop, the file is imported by itself
        if (seen.has(dependency)) {
          return;
        }

        loaderContext.addDependency(path.normalize(dependency));

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

export default async function createEvaluator(loaderContext, code, options) {
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

  return class CustomEvaluator extends Evaluator {
    visitImport(imported) {
      this.return += 1;

      const node = this.visit(imported.path).first;
      const nodePath = (!node.val.isNull && node.val) || node.name;

      this.return -= 1;

      let webpackResolveError;

      if (node.name !== 'url' && nodePath && !URL_RE.test(nodePath)) {
        const dependencies = resolvedDependencies.get(node.filename);

        if (dependencies) {
          const dependency = dependencies.find((item) => {
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

          if (dependency) {
            const { resolved } = dependency;

            if (!Array.isArray(resolved)) {
              node.string = resolved;
            } else if (resolved.length > 0) {
              const blocks = resolved.map((item) => {
                const clonedImported = imported.clone();
                const clonedNode = this.visit(clonedImported.path).first;

                clonedNode.string = item;

                let result;

                try {
                  result = super.visitImport(clonedImported);
                } catch (error) {
                  loaderContext.emitError(
                    new Error(
                      `Stylus resolver error: ${error.message}${
                        webpackResolveError
                          ? `\n\nWebpack resolver error details:\n${webpackResolveError.details}\n\n` +
                            `Webpack resolver error missing:\n${webpackResolveError.missing}\n\n`
                          : ''
                      }`
                    )
                  );

                  return imported;
                }

                return result;
              });

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
                ? `\n\nWebpack resolver error details:\n${webpackResolveError.details}\n\n` +
                  `Webpack resolver error missing:\n${webpackResolveError.missing}\n\n`
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
