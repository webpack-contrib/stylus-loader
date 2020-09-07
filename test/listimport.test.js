import path from 'path';

import {
  compile,
  getCodeFromBundle,
  getCompiler,
  getErrors,
  getWarnings,
} from './helpers';

describe('listimport', () => {
  const cases = [
    {
      name: 'recognizes @import',
      asset: './imports/import.styl',
    },
    {
      name: 'recognizes @require',
      asset: './imports/require.styl',
    },
    {
      name: 'recognizes use()',
      asset: './imports/use.styl',
    },
    {
      name: 'recognizes json()',
      asset: './imports/json.styl',
    },
    {
      name: 'recognizes block-level imports',
      asset: './imports/block-level.styl',
    },
  ];

  for (const item of cases) {
    it(item.name, async () => {
      const testId = item.asset;
      const compiler = getCompiler(
        testId,
        {},
        {
          module: {
            rules: [
              {
                test: /\.styl$/i,
                rules: [
                  {
                    loader: require.resolve('./helpers/testLoader'),
                  },
                  {
                    loader: path.resolve(
                      __dirname,
                      './helpers/stylus-import-loader'
                    ),
                    options: {},
                  },
                ],
              },
            ],
          },
        }
      );
      const stats = await compile(compiler);
      const codeFromBundle = getCodeFromBundle(stats, compiler);

      expect(codeFromBundle.css).toMatchSnapshot('css');
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });
  }
});
