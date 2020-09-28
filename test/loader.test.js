/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

import {
  compile,
  getCodeFromBundle,
  getCodeFromStylus,
  getCompiler,
  getErrors,
  getWarnings,
  validateDependencies,
} from './helpers';

jest.setTimeout(30000);

describe('loader', () => {
  it('should work', async () => {
    const testId = './basic.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it("shouldn't import css", async () => {
    const testId = './import-css.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should import css', async () => {
    const testId = './import-css.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        includeCSS: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        includeCSS: true,
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should import stylus', async () => {
    const testId = './import-styl.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should import stylus from process.cwd', async () => {
    const testId = './import-cwd.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it("shouldn't process urls", async () => {
    const testId = './urls.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work when stylusOptions is function', async () => {
    function plugin() {
      return (style) => {
        style.define('add', (a, b) => {
          return a.operate('+', b);
        });
      };
    }

    const testId = './webpack.config-plugin.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: (loaderContext) => {
        const { resourcePath, rootContext } = loaderContext;
        const relativePath = path.relative(rootContext, resourcePath);

        if (relativePath === 'webpack.config-plugin.styl') {
          return { use: plugin() };
        }

        return {};
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        use: plugin(),
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('with option, should resolve urls relatively', async () => {
    const testId = './shallow-deep.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        resolveURL: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        // In stylus-loader nocheck option enable to default
        resolveURL: { nocheck: true },
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('with option, should resolve urls relatively with loader inline syntax', async () => {
    const testId = './shallow-deep-webpack.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        resolveURL: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    // const codeFromStylus = await getCodeFromStylus(testId);

    // Stylus url-resolver does not work with loader inline syntax
    // expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('with option, should not resolve urls relatively', async () => {
    const testId = './shallow-deep-webpack.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        resolveURL: false,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        // eslint-disable-next-line no-undefined
        resolveURL: undefined,
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('with option resolveURL nocheck is "false", should not resolve missing urls relatively', async () => {
    const testId = './shallow-deep.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        resolveURL: {
          nocheck: false,
        },
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        resolveURL: { nocheck: false },
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('with option, should resolve urls relatively when literal', async () => {
    const testId = './shallow-deep-literal.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        includeCSS: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        resolveURL: { nocheck: true },
        includeCSS: true,
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('with option, should resolve urls relatively when is set "dest"', async () => {
    const testId = './shallow-deep-literal.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        dest: 'deep/deep-literal.css',
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        resolveURL: { nocheck: true },
        dest: 'deep/deep-literal.css',
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('with paths, find deps and load like normal stylus', async () => {
    const testId = './import-paths.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        paths: ['test/fixtures/paths'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ['test/fixtures/paths'],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('stylus can find modules in node_modules', async () => {
    const testId = './import-fakenib.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it("resolve with webpack if stylus can't find it", async () => {
    const testId = './import-webpack.styl';
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          modules: [path.join(__dirname, 'fixtures', 'web_modules')],
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('in a nested import load module from paths', async () => {
    const testId = './shallow-paths.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        paths: ['test/fixtures/paths'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ['test/fixtures/paths'],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work indented import', async () => {
    const testId = './shallow-indent.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    const { fileDependencies } = stats.compilation;

    validateDependencies(fileDependencies);

    const fixturesDir = path.resolve(__dirname, 'fixtures');
    const fixtures = [
      path.resolve(fixturesDir, 'basic.styl'),
      path.resolve(fixturesDir, 'deep', 'import-fakenib.styl'),
      path.resolve(fixturesDir, 'node_modules', 'fakenib', 'index.styl'),
      path.resolve(fixturesDir, 'shallow-indent.styl'),
    ];

    fixtures.forEach((fixture) => {
      expect(fileDependencies.has(fixture)).toBe(true);
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it.skip('should work binop import', async () => {
    const testId = './import-binop.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);
    const { fileDependencies } = stats.compilation;

    validateDependencies(fileDependencies);

    const fixturesDir = path.resolve(__dirname, 'fixtures');
    const fixtures = [
      path.resolve(fixturesDir, 'deep', 'import-fakenib-binop.styl'),
      path.resolve(fixturesDir, 'node_modules', 'fakenib', 'index.styl'),
      path.resolve(fixturesDir, 'import-binop.styl'),
    ];

    fixtures.forEach((fixture) => {
      expect(fileDependencies.has(fixture)).toBe(true);
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('in a nested import load module from node_modules', async () => {
    const testId = './shallow-fakenib.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('in a nested import load module from webpack', async () => {
    const testId = './shallow-webpack.styl';
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          modules: [path.join(__dirname, 'fixtures', 'web_modules')],
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('resolves css with webpack but does not import it', async () => {
    const testId = './import-webpack-css.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "use" option', async () => {
    function plugin() {
      return (style) => {
        style.define('add', (a, b) => {
          return a.operate('+', b);
        });
      };
    }

    const testId = './webpack.config-plugin.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: [plugin()],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        use: [plugin()],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "use" option as Array<string>', async () => {
    const testId = './basic.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: ['nib'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        // eslint-disable-next-line global-require
        use: require('nib')(),
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with bootstrap', async () => {
    const testId = './lib-bootstrap.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: ['bootstrap-styl'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        // eslint-disable-next-line global-require
        use: require('bootstrap-styl')(),
        resolveURL: { nocheck: true },
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with plugin using bootsrtap', async () => {
    // eslint-disable-next-line global-require
    const bootsrap = require('bootstrap-styl');

    function plugin() {
      return (styl) => {
        bootsrap()(styl);

        // assume that /lib/StylusLibA contains all the .styl files.
        styl.include(`${__dirname}/lib/`);
      };
    }
    const testId = './lib-bootstrap.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: [plugin()],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        use: [plugin()],
        resolveURL: { nocheck: true },
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "define" option', async () => {
    const testId = './webpack.config-plugin.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        define: {
          add: (a, b) => a.operate('+', b),
        },
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        define: {
          add: (a, b) => a.operate('+', b),
        },
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "define" option with raw', async () => {
    const testId = './defineRaw.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        define: [
          ['rawVar', { nestedVar: 42 }, true],
          ['castedVar', { disc: 'outside' }, true],
          ['rawDefine', ['rawVar'], true],
        ],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        define: [
          ['rawVar', { nestedVar: 42 }, true],
          ['castedVar', { disc: 'outside' }, true],
          ['rawDefine', ['rawVar'], true],
        ],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('correctly compiles mixin calls inside imported files', async () => {
    const testId = './import-mixins/index.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should compile an @import URL through the CSS loader', async () => {
    const testId = './import-google-font.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it.skip('imports files listed in option argument', async () => {
    const testId = './stylus.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['urls.styl'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ['urls.styl'],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it.skip('imports files listed in option argument stylus paths style', async () => {
    const testId = './stylus.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['in-paths.styl'],
        paths: [`${__dirname}/fixtures/paths`],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ['in-paths.styl'],
        paths: [`${__dirname}/fixtures/paths`],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it.skip('imports files listed in option argument webpack style', async () => {
    const testId = './stylus.styl';
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          import: ['fakenib'],
        },
      },
      {
        resolve: {
          modules: ['node_modules'],
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ['fakenib'],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in option "style" package.json', async () => {
    const testId = './import-fakestylus.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it.skip('imports files listed in option argument and deps', async () => {
    const testId = './basic.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['import-styl.styl'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ['import-styl.styl'],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('with paths, find deps with spaces and load like normal stylus', async () => {
    const testId = './import-paths space.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        paths: [path.resolve(__dirname, 'fixtures', 'paths with space')],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: [path.resolve(__dirname, 'fixtures', 'paths with space')],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "include" option', async () => {
    const testId = './include-option.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        include: [`${__dirname}/fixtures/paths`],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        include: [`${__dirname}/fixtures/paths`],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it.skip('should work "nib"', async () => {
    const testId = './basic-nib.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        // eslint-disable-next-line global-require
        use: [require('nib')()],
        import: ['nib'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        // eslint-disable-next-line global-require
        use: [require('nib')()],
        import: ['nib'],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in glob with deps', async () => {
    const testId = './import-glob.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    const { fileDependencies, contextDependencies } = stats.compilation;

    validateDependencies(fileDependencies);
    validateDependencies(contextDependencies);

    const fixturesDir = path.resolve(__dirname, 'fixtures');

    [
      path.resolve(fixturesDir, 'import-glob.styl'),
      path.resolve(fixturesDir, 'glob', 'a.styl'),
      path.resolve(fixturesDir, 'glob', 'b.styl'),
      path.resolve(fixturesDir, 'glob-files', 'index.styl'),
      path.resolve(fixturesDir, 'glob-files', 'dir', 'a.styl'),
      path.resolve(fixturesDir, 'glob-files', 'dir', 'b.styl'),
    ].forEach((fixture) => {
      expect(fileDependencies.has(fixture)).toBe(true);
    });

    [
      fixturesDir,
      path.resolve(fixturesDir, 'glob'),
      path.resolve(fixturesDir, 'glob-files'),
    ].forEach((fixture) => {
      expect(contextDependencies.has(fixture)).toBe(true);
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files with special characters listed in glob', async () => {
    const testId = './import-glob-special.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    // Support characters that it supports native stylus
    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in glob with webpack import with deps', async () => {
    const testId = './import-glob-webpack.styl';
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            globAlias: path.resolve(__dirname, 'fixtures', 'glob-webpack-2'),
            globAlias2: path.resolve(__dirname, 'fixtures', 'glob'),
          },
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);
    const { fileDependencies, contextDependencies } = stats.compilation;

    validateDependencies(fileDependencies);
    validateDependencies(contextDependencies);

    const fixturesDir = path.resolve(__dirname, 'fixtures');

    [
      path.resolve(fixturesDir, 'glob-webpack-2', 'a.styl'),
      path.resolve(fixturesDir, 'glob-webpack-2', 'b.styl'),
      path.resolve(fixturesDir, 'glob-webpack-2', 'index.styl'),
      path.resolve(fixturesDir, 'glob-webpack', 'a.styl'),
      path.resolve(fixturesDir, 'glob-webpack', 'b.styl'),
      path.resolve(fixturesDir, 'glob', 'a.styl'),
      path.resolve(fixturesDir, 'glob', 'b.styl'),
      path.resolve(fixturesDir, 'import-glob-webpack.styl'),
      path.resolve(fixturesDir, 'node_modules', 'glob_package', 'a.styl'),
      path.resolve(fixturesDir, 'node_modules', 'glob_package', 'b.styl'),
      path.resolve(fixturesDir, 'node_modules', 'glob_package', 'index.styl'),
    ].forEach((fixture) => {
      expect(fileDependencies.has(fixture)).toBe(true);
    });

    [
      path.resolve(fixturesDir, 'glob'),
      path.resolve(fixturesDir, 'glob-webpack'),
      path.resolve(fixturesDir, 'glob-webpack-2'),
      path.resolve(fixturesDir, 'node_modules', 'glob_package'),
    ].forEach((fixture) => {
      expect(contextDependencies.has(fixture)).toBe(true);
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in glob **/* with deps', async () => {
    const testId = './import-glob-all.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    const { fileDependencies } = stats.compilation;

    validateDependencies(fileDependencies);

    const rootDir = path.resolve(__dirname, 'fixtures', 'glob-all');
    const fixtures = [
      path.resolve(rootDir, '..', 'import-glob-all.styl'),
      path.resolve(rootDir, 'a.styl'),
      path.resolve(rootDir, 'a-glob', 'file.styl'),
      path.resolve(rootDir, 'a-glob', 'a-deep', 'a-deep.styl'),
      path.resolve(rootDir, 'a-glob', 'a-deep', 'sub-deep', 'sub-deep.styl'),
      path.resolve(rootDir, 'b-glob', 'file.styl'),
    ];

    fixtures.forEach((fixture) => {
      expect(fileDependencies.has(fixture)).toBe(true);
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in glob with webpack import 2', async () => {
    const testId = './import-glob-webpack-2.styl';
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            globAliasDot: path.resolve(__dirname, 'fixtures', 'glob-webpack-2'),
            globAlias2: path.resolve(__dirname, 'fixtures', 'glob'),
          },
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in nested glob import', async () => {
    const testId = './import-glob-nested.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in nested glob with webpack import', async () => {
    const testId = './import-glob-webpack-nested.styl';
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            aliasNested: path.resolve(__dirname, 'fixtures', 'glob-nested'),
          },
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should emit error when imports files listed as glob in empty directory', async () => {
    const testId = './import-glob-empty-dir.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    await expect(getCodeFromStylus(testId)).rejects.toThrow();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in glob import package', async () => {
    const testId = './import-glob-package.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in glob import package through webpack', async () => {
    const testId = './import-glob-webpack-package.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it.skip('imports files in dir like a glob', async () => {
    const isWin = process.platform === 'win32';

    if (isWin) {
      expect(true).toBe(true);
    } else {
      const rootdir = path.resolve(__dirname, 'fixtures', 'node_modules');
      const exampleDir = path.resolve(rootdir, 'like-a-glob-example');
      const pathDir = path.resolve(rootdir, 'like-a-glob*');

      if (!fs.existsSync(pathDir)) {
        fs.mkdirSync(pathDir);
        fs.copyFileSync(
          path.resolve(exampleDir, 'package.json'),
          path.resolve(pathDir, 'package.json')
        );
        fs.copyFileSync(
          path.resolve(exampleDir, 'index.styl'),
          path.resolve(pathDir, 'index.styl')
        );
      }

      const testId = './import-dir-like-a-glob.styl';
      const compiler = getCompiler(testId);
      const stats = await compile(compiler);
      const codeFromBundle = getCodeFromBundle(stats, compiler);
      const codeFromStylus = await getCodeFromStylus(testId);

      expect(codeFromBundle.css).toBe(codeFromStylus.css);
      expect(codeFromBundle.css).toMatchSnapshot('css');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    }
  });

  it.skip('imports files in dir like a glob through webpack', async () => {
    const isWin = process.platform === 'win32';

    if (isWin) {
      expect(true).toBe(true);
    } else {
      const rootdir = path.resolve(__dirname, 'fixtures', 'node_modules');
      const exampleDir = path.resolve(rootdir, 'like-a-glob-example');
      const pathDir = path.resolve(rootdir, 'like-a-glob*');

      if (!fs.existsSync(pathDir)) {
        fs.mkdirSync(pathDir);
        fs.copyFileSync(
          path.resolve(exampleDir, 'package.json'),
          path.resolve(pathDir, 'package.json')
        );
        fs.copyFileSync(
          path.resolve(exampleDir, 'index.styl'),
          path.resolve(pathDir, 'index.styl')
        );
      }

      const testId = './import-webpack-dir-like-a-glob.styl';
      const compiler = getCompiler(testId);
      const stats = await compile(compiler);
      const codeFromBundle = getCodeFromBundle(stats, compiler);
      const codeFromStylus = await getCodeFromStylus(testId);

      // Native stylus incorrectly identifies the directory id directory like a glob
      expect(codeFromBundle.css).toBe(codeFromStylus.css);
      expect(codeFromBundle.css).toMatchSnapshot('css');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    }
  });

  it.skip('imports files listed in option as glob', async () => {
    const testId = './basic.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['glob/*'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        import: ['glob/*'],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in option as glob with webpack import', async () => {
    const testId = './import-glob-alias.styl';
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            globSimpleAlias: path.resolve(__dirname, 'fixtures', 'glob'),
          },
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports and paths deps', async () => {
    const testId = './import-paths.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        paths: [`${__dirname}/fixtures/paths`],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: [`${__dirname}/fixtures/paths`],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports and webpack deps', async () => {
    const testId = './import-webpack.styl';
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          modules: [path.join(__dirname, 'fixtures', 'web_modules')],
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports and webpack alias', async () => {
    const testId = './import-webpack-alias.styl';
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            alias: path.resolve(__dirname, 'fixtures', 'alias'),
          },
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports the right file based on context', async () => {
    const testId = './context';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should not be resolved when url begin with "#"', async () => {
    const testId = './no-import.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: { resolveURL: { nocheck: true } },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "hoistAtrules" option', async () => {
    const testId = './hoist-atrules.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        hoistAtrules: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        hoistAtrules: true,
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "prefix" option', async () => {
    const testId = './prefix.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        prefix: 'prefix-',
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        prefix: 'prefix-',
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "lineNumbers" option', async () => {
    const testId = './basic.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        lineNumbers: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        lineNumbers: true,
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    // expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "compress" option', async () => {
    const testId = './basic.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        compress: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        compress: true,
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work compress in "production" mode', async () => {
    const testId = './basic.styl';
    const compiler = getCompiler(testId, {}, { mode: 'production' });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        compress: true,
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should use .json file', async () => {
    const testId = './json/index.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        paths: ['test/fixtures/node_modules/vars'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ['test/fixtures/node_modules/vars'],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should emit error when unresolved import', async () => {
    const testId = './import-unresolve.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const { fileDependencies } = stats.compilation;

    validateDependencies(fileDependencies);

    const fixturesDir = path.resolve(__dirname, 'fixtures');
    const fixtures = [path.resolve(fixturesDir, 'import-unresolve.styl')];

    fixtures.forEach((fixture) => {
      expect(fileDependencies.has(fixture)).toBe(true);
    });

    await expect(getCodeFromStylus(testId)).rejects.toThrow();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should emit warning when use unresolved plugin', async () => {
    const testId = './webpack.config-plugin.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        use: ['unresolved'],
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should emit error when import self', async () => {
    const testId = './imports/self.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    await expect(getCodeFromStylus(testId)).rejects.toThrow();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(
      getErrors(stats).map((item) =>
        // Due bug in `node-glob`
        process.platform === 'win32'
          ? item.replace(
              'failed to locate @import file self.styl',
              'import loop has been found'
            )
          : item
      )
    ).toMatchSnapshot('errors');
  });

  it('should emit error when import loop', async () => {
    const testId = './import-recursive.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    await expect(getCodeFromStylus(testId)).rejects.toThrow();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should emit error when parse error', async () => {
    const testId = './parse-error.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    await expect(getCodeFromStylus(testId)).rejects.toThrow();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should emit error when empty import', async () => {
    const testId = './empty-import.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    await expect(getCodeFromStylus(testId)).rejects.toThrow();
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should emit error when unresolved import glob', async () => {
    const testId = './import-unresolve-glob.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    await expect(getCodeFromStylus(testId)).rejects.toThrow();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
