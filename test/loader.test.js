import path from 'path';

import {
  compile,
  getCodeFromBundle,
  getCompiler,
  getErrors,
  getWarnings,
} from './helpers';

describe('loader', () => {
  it('should work', async () => {
    const testId = './basic.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it("shouldn't import css", async () => {
    const testId = './import-css.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

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

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should import stylus', async () => {
    const testId = './import-styl.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it("shouldn't process urls", async () => {
    const testId = './urls.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

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

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('with option, should resolve urls relatively', async () => {
    const testId = './shallow.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        resolveUrl: true,
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

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

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('stylus can find modules in node_modules', async () => {
    const testId = './import-fakenib.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it("resolve with webpack if stylus can't find it", async () => {
    const testId = './import-webpack.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

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

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('in a nested import load module from node_modules', async () => {
    const testId = './shallow-fakenib.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('in a nested import load module from webpack', async () => {
    const testId = './shallow-webpack.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('resolves css with webpack but does not import it', async () => {
    const testId = './import-webpack-css.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('in a nested import resolve css with webpack but not import', async () => {
    const testId = './import-webpack-css.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

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

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "define" option', async () => {
    const testId = './webpack.config-plugin.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        define: [['add', (a, b) => a.operate('+', b)]],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

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

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('correctly compiles mixin calls inside imported files', async () => {
    const testId = './import-mixins/index.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should compile an @import URL through the CSS loader', async () => {
    const testId = './import-google-font.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in option argument', async () => {
    const testId = './stylus.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['urls.styl'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in option argument stylus paths style', async () => {
    const testId = './stylus.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['in-paths.styl'],
        paths: [`${__dirname}/fixtures/paths`],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "include" option', async () => {
    const testId = './stylus.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['in-paths.styl'],
        include: [`${__dirname}/fixtures/paths`],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work "nib"', async () => {
    const testId = './basic-nib';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        // eslint-disable-next-line global-require
        use: [require('nib')()],
        import: ['nib'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in option argument webpack style', async () => {
    const testId = './stylus.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['~fakenib'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in option "style" package.json', async () => {
    const testId = './stylus.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['~fakestylus'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in option argument and deps', async () => {
    const testId = './basic.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['import-styl.styl'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in option argument and paths deps', async () => {
    const testId = './basic.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['import-paths.styl'],
        paths: [`${__dirname}/fixtures/paths`],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports files listed in option argument and webpack deps', async () => {
    const testId = './basic.styl';
    const compiler = getCompiler(testId, {
      stylusOptions: {
        import: ['import-webpack.styl'],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('imports the right file based on context', async () => {
    const testId = './context';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should not be resolved when url begin with "#"', async () => {
    const testId = './no-import.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should emit error when unresolved import', async () => {
    const testId = './import-unresolve.styl';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

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
});
