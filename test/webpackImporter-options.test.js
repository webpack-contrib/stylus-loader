import path from 'path';

import {
  compile,
  getCodeFromBundle,
  getCompiler,
  getErrors,
  getWarnings,
} from './helpers';

describe('webpackImporter option', () => {
  it('should work when value is not specify', async () => {
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

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work when value is "true"', async () => {
    const testId = './import-webpack.styl';
    const compiler = getCompiler(
      testId,
      {
        webpackImporter: true,
      },
      {
        resolve: {
          modules: [path.join(__dirname, 'fixtures', 'web_modules')],
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work when value is "false"', async () => {
    const testId = './shallow-paths.styl';
    const compiler = getCompiler(testId, {
      webpackImporter: false,
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

  it('should throw an error on webpack import when value is "false"', async () => {
    const testId = './import-webpack.styl';
    const compiler = getCompiler(
      testId,
      {
        webpackImporter: false,
      },
      {
        resolve: {
          modules: [path.join(__dirname, 'fixtures', 'web_modules')],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
