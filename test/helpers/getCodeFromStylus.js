import path from 'path';
import fs from 'fs';

import stylus from 'stylus';
import Evaluator from 'stylus/lib/visitor/evaluator';

const fixturesDir = path.resolve(__dirname, '..', 'fixtures');
const pathMap = {
  '~globAlias': path.resolve(fixturesDir, 'glob-webpack-2'),
  '~globAlias2/*': path.resolve(fixturesDir, 'glob/*'),
  '~aliasNested/**/file.styl': 'glob-nested/**/file.styl',
  '~globAliasDot/*': 'glob-webpack-2/*',
  'glob_package/*': 'node_modules/glob_package/*',
  'alias/1': path.resolve(fixturesDir, 'alias', '1.styl'),
  '~alias/2': path.resolve(fixturesDir, 'alias', '2.styl'),
  'globAlias/*': path.resolve(fixturesDir, 'glob-webpack/*'),
  '~globSimpleAlias/*': path.resolve(fixturesDir, 'glob/*'),
  fakenib: path.resolve(fixturesDir, 'node_modules', 'fakenib', 'index.styl'),
  '~fakenib': path.resolve(
    fixturesDir,
    'node_modules',
    'fakenib',
    'index.styl'
  ),
  fakestylus: path.resolve(
    fixturesDir,
    'node_modules',
    'fakestylus',
    'main.styl'
  ),
  '~fakestylus': path.resolve(
    fixturesDir,
    'node_modules',
    'fakestylus',
    'main.styl'
  ),
  '~glob_package/*': path.resolve(
    fixturesDir,
    'node_modules',
    'glob_package/*'
  ),
  '~in-web-modules': path.resolve(
    fixturesDir,
    'web_modules',
    'in-web-modules',
    'index.styl'
  ),
  '~in-web-modules/index': path.resolve(
    fixturesDir,
    'web_modules',
    'in-web-modules',
    'index.styl'
  ),
  '~webpack-like-a-glob-package-name*': path.resolve(
    fixturesDir,
    'node_modules',
    process.platform === 'win32'
      ? 'webpack-like-a-glob-package-name'
      : 'webpack-like-a-glob-package-name*',
    'index.styl'
  ),
};

function evaluator() {
  return class CustomEvaluator extends Evaluator {
    visitImport(imported) {
      try {
        return super.visitImport(imported);
      } catch (ignoreError) {
        // Then use the webpack resolver
      }

      this.return += 1;

      const node = imported.path.first;
      const nodePath = node.string;

      this.return -= 1;

      const resolved = pathMap[nodePath];

      if (resolved) {
        node.string = resolved;
      }

      return super.visitImport(imported);
    }
  };
}

async function getCodeFromStylus(testId, options = {}) {
  const defaultOptions = {
    shouldUseWebpackImporter: true,
  };
  const stylusOptions = options.stylusOptions || {};
  let pathToFile = path.resolve(__dirname, '..', 'fixtures', testId);
  let data;

  try {
    data = await fs.promises.readFile(pathToFile);
    // May be directory
  } catch (ignoreError) {
    pathToFile = path.resolve(pathToFile, 'index.styl');

    data = await fs.promises.readFile(pathToFile);

    if (typeof data === 'undefined') {
      throw ignoreError;
    }
  }

  if (typeof options.additionalData !== 'undefined') {
    data =
      typeof options.additionalData === 'function'
        ? `${options.additionalData(data, {
            rootContext: path.resolve(__dirname, '../fixtures'),
            resourcePath: pathToFile,
          })}`
        : `${options.additionalData}\n${data}`;
  }

  const mergedOptions = {
    ...defaultOptions,
    ...stylusOptions,
  };

  mergedOptions.filename = pathToFile;
  mergedOptions.dest = path.dirname(pathToFile);

  const styl = stylus(data.toString(), mergedOptions);

  if (stylusOptions.hoistAtrules) {
    styl.set('hoist atrules', true);
  }

  if (stylusOptions.lineNumbers) {
    styl.set('linenos', true);
  }

  if (mergedOptions.shouldUseWebpackImporter) {
    styl.set('Evaluator', evaluator());
  }

  if (stylusOptions.includeCSS) {
    styl.set('include css', true);
  }

  if (typeof stylusOptions.include !== 'undefined') {
    for (const included of stylusOptions.include) {
      styl.include(included);
    }
  }

  if (typeof stylusOptions.resolveURL !== 'undefined') {
    styl.define('url', stylus.resolver(stylusOptions.resolveURL));
  }

  if (typeof stylusOptions.import !== 'undefined') {
    for (const imported of stylusOptions.import) {
      styl.import(imported);
    }
  }

  if (typeof stylusOptions.define !== 'undefined') {
    const definitions = Array.isArray(stylusOptions.define)
      ? stylusOptions.define
      : Object.entries(stylusOptions.define);

    for (const defined of definitions) {
      styl.define(...defined);
    }
  }

  return stylRender(styl);
}

function stylRender(styl) {
  return new Promise((resolve, reject) => {
    styl.render(async (error, css) => {
      if (error) {
        reject(error);
      }

      const map = styl.sourcemap;

      resolve({ css, map });
    });
  });
}

export default getCodeFromStylus;
