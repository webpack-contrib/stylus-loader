<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![chat][chat]][chat-url]
[![size][size]][size-url]

# stylus-loader

A Stylus loader for webpack. Compiles Styl to CSS.

## Getting Started

To begin, you'll need to install `stylus` and `stylus-loader`:

```console
$ npm install stylus stylus-loader --save-dev
```

Then add the loader to your `webpack` config. For example:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/,
        loader: 'stylus-loader', // compiles Styl to CSS
      },
    ],
  },
};
```

And run `webpack` via your preferred method.

## Options

|                 Name                  |         Type         |      Default       | Description                                 |
| :-----------------------------------: | :------------------: | :----------------: | :------------------------------------------ |
| **[`stylusOptions`](#stylusOptions)** | `{Object\|Function}` |        `{}`        | Options for Stylus.                         |
|     **[`sourceMap`](#sourcemap)**     |     `{Boolean}`      | `compiler.devtool` | Enables/Disables generation of source maps. |

### `stylusOptions`

Type: `Object|Function`
Default: `{}`

You can pass any Stylus specific options to the `stylus-loader` through the `stylusOptions` property in the [loader options](https://webpack.js.org/configuration/module/#rule-options-rule-query).
See the [Stylus documentation](https://stylus-lang.com/docs/js.html).
Options in dash-case should use camelCase.

#### `Object`

Use an object to pass options through to Stylus.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'stylus-loader',
            options: {
              stylusOptions: {
                use: ['nib'],
                include: [path.join(__dirname, 'src/styl/config')],
                import: ['nib', path.join(__dirname, 'src/styl/mixins')],
                define: [
                  // [key, value, raw]
                  ['$development', process.env.NODE_ENV === 'development'],
                  ['rawVar', 42, true],
                ],
                includeCSS: false,
                resolveUrl: false,
              },
            },
          },
        ],
      },
    ],
  },
};
```

#### `Function`

Allows setting the options passed through to Less based off of the loader context.

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'stylus-loader',
            options: {
              stylusOptions: (loaderContext) => {
                // More information about available properties https://webpack.js.org/api/loaders/
                const { resourcePath, rootContext } = loaderContext;
                const relativePath = path.relative(rootContext, resourcePath);

                if (relativePath === 'styles/foo.styl') {
                  return {
                    paths: ['absolute/path/c', 'absolute/path/d'],
                  };
                }

                return {
                  paths: ['absolute/path/a', 'absolute/path/b'],
                };
              },
            },
          },
        ],
      },
    ],
  },
};
```

### `sourceMap`

Type: `Boolean`

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'stylus-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
};
```

## Examples

### Normal usage

Chain the `stylus-loader` with the [`css-loader`](https://github.com/webpack-contrib/css-loader) and the [`style-loader`](https://github.com/webpack-contrib/style-loader) to immediately apply all styles to the DOM.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/,
        use: [
          {
            loader: 'style-loader', // creates style nodes from JS strings
          },
          {
            loader: 'css-loader', // translates CSS into CommonJS
          },
          {
            loader: 'stylus-loader', // compiles Stylus to CSS
          },
        ],
      },
    ],
  },
};
```

### Source maps

To enable sourcemaps for CSS, you'll need to pass the `sourceMap` property in the loader's options. If this is not passed, the loader will respect the setting for webpack source maps, set in `devtool`.

**webpack.config.js**

```javascript
module.exports = {
  devtool: 'source-map', // any "source-map"-like devtool is possible
  module: {
    rules: [
      {
        test: /\.styl$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'stylus-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
};
```

### Using nib with stylus

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/,
        use: [
          {
            loader: 'style-loader', // creates style nodes from JS strings
          },
          {
            loader: 'css-loader', // translates CSS into CommonJS
          },
          {
            loader: 'stylus-loader', // compiles Stylus to CSS
            options: {
              stylusOptions: {
                use: [require('nib')()],
                import: ['nib'],
              },
            },
          },
        ],
      },
    ],
  },
};
```

### In production

Usually, it's recommended to extract the style sheets into a dedicated file in production using the [MiniCssExtractPlugin](https://github.com/webpack-contrib/mini-css-extract-plugin). This way your styles are not dependent on JavaScript.

### Extracting style sheets

Bundling CSS with webpack has some nice advantages like referencing images and fonts with hashed urls or [hot module replacement](https://webpack.js.org/concepts/hot-module-replacement/) in development. In production, on the other hand, it's not a good idea to apply your style sheets depending on JS execution. Rendering may be delayed or even a [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) might be visible. Thus it's often still better to have them as separate files in your final production build.

There are two possibilities to extract a style sheet from the bundle:

- [`extract-loader`](https://github.com/peerigon/extract-loader) (simpler, but specialized on the css-loader's output)
- [MiniCssExtractPlugin](https://github.com/webpack-contrib/mini-css-extract-plugin) (more complex, but works in all use-cases)

## Contributing

Please take a moment to read our contributing guidelines if you haven't yet done so.

[CONTRIBUTING](./.github/CONTRIBUTING.md)

## License

[MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/stylus-loader.svg
[npm-url]: https://npmjs.com/package/stylus-loader
[node]: https://img.shields.io/node/v/stylus-loader.svg
[node-url]: https://nodejs.org
[deps]: https://david-dm.org/webpack-contrib/stylus-loader.svg
[deps-url]: https://david-dm.org/webpack-contrib/stylus-loader
[tests]: https://github.com/webpack-contrib/stylus-loader/workflows/stylus-loader/badge.svg
[tests-url]: https://github.com/webpack-contrib/stylus-loader/actions
[cover]: https://codecov.io/gh/webpack-contrib/stylus-loader/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/stylus-loader
[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack
[size]: https://packagephobia.now.sh/badge?p=stylus-loader
[size-url]: https://packagephobia.now.sh/result?p=stylus-loader
