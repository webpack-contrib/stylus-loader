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

  it('should allow stylus plugins to be configured in webpack.config.js', async () => {
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
});
