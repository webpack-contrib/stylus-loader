# stylus-relative-loader
A [stylus](http://learnboost.github.io/stylus/) loader for [webpack](https://github.com/webpack/webpack),
with fixed relative imports.

[![NPM version](https://badge.fury.io/js/stylus-relative-loader.svg)](https://badge.fury.io/js/stylus-relative-loader)

## vs. stylus-loader

With `stylus-loader` (which inherits a lot of behavior from Stylus itself),
relative path imports like `./variables` and `./color`, don't necessarily
resolve to the path relative to the file in which the import is found. In fact,
they have the same meaning as just importing `variables` and `color`. This means
the paths are resolved using the Stylus "context" – in effect, you could get the
file at the requested relative path, a file in an ancestor directory, a node
module, or a file within another module that happens to have the same name.

For example:

```
styles
├── a
│   ├── color.styl
│   └── index.styl
├── b
│   ├── color.styl
│   └── index.styl
├── color.styl
└── index.styl
```

Let's say `styles/index.styl` contains:

```stylus
@import './a';
@import './b';
@import './color';
```

...while `a/index.styl` and `b/index.styl` both contain:

```stylus
@import './color';
```

With vanilla `stylus-loader`, the output would be ONLY the contents of
`styles/color.styl`, repeated 3 times. Despite the `./color` imports in `a` and
`b` explicitly calling for `a/color.styl` and `b/color.styl` to be included,
they won't be – merely because another relative path was imported with the
same name.

If you're using very modularized styles (say, some of your imports come from
`node_modules`) this behavior can spell big trouble. You basically have to
ensure that all Stylus filenames in your dependency tree are unique, otherwise
some styles/variables/mixins might go missing!

`stylus-relative-loader` fixes this issue by patching relative imports to all
resolve as if they were full absolute paths. That means you'd get all of
`color.styl`, `a/color.styl`, and `b/color.styl` above.

### Status of this fork

There are no doubt people depending on the behavior described above, using it as
a feature, not a bug. We'd love it if this behavior were adopted upstream, as
we don't intend to fully support this fork for a wide audience in the long-term.

## Usage

```js
var css = require('!raw!stylus-relative!./file.styl'); // Just the CSS
var css = require('!css!stylus-relative!./file.styl'); // CSS with processed url(...)s
```

See [css-loader](https://github.com/webpack/css-loader) to see the effect of processed `url(...)`s.

Or within the webpack config:

```js
module: {
  loaders: [{
    test: /\.styl$/,
    loader: 'css-loader!stylus-relative-loader?paths=node_modules/bootstrap-stylus/stylus/'
  }]
}
```

Then you can: `var css = require('./file.styl');`.

Use in tandem with the [style-loader](https://github.com/webpack/style-loader) to add the css rules to your `document`:

```js
module: {
  loaders: [
    { test: /\.styl$/, loader: 'style-loader!css-loader!stylus-relative-loader' }
  ]
}
```

and then `require('./file.styl');` will compile and add the CSS to your page.

`stylus-relative-loader` can also take advantage of webpack's resolve options. With the default options it'll find files in `web_modules` as well as `node_modules`, make sure to prefix any lookup in node_modules with `~`. For example if you have a styles package lookup files in it like `@import '~styles/my-styles`. It can also find stylus files without having the extension specified in the `@import` and index files in folders if webpack is configured for stylus's file extension.

```js
module: {
  resolve: {
    extensions: ['', '.js', '.styl']
  }
}
```

will let you have an `index.styl` file in your styles package and `require('styles')` or `@import '~styles'` it. It also lets you load a stylus file from a package installed in node_modules or if you add a modulesDirectories, like `modulesDirectories: ['node_modules', 'web_modules', 'bower_components']` option you could load from a folder like bower_components. To load files from a relative path leave off the `~` and `@import 'relative-styles/my-styles';` it.

Be careful though not to use the extensions configuration for two types of in one folder. If a folder has a `index.js` and a `index.styl` and you `@import './that-folder'`, it'll end up importing a javascript file into your stylus.

### Stylus Plugins

You can also use stylus plugins by adding an extra `stylus` section to your `webpack.config.js`.

```js
var stylus_plugin = require('stylus_plugin');
module: {
  loaders: [
    { test: /\.styl$/, loader: 'style-loader!css-loader!stylus-relative-loader' }
  ]
},
stylus: {
  use: [stylus_plugin()]
}
```

#### Using nib with stylus

The easiest way of enabling `nib` is to import it in the stylus options:

```js
stylus: {
  use: [require('nib')()],
  import: ['~nib/lib/nib/index.styl']
}
```

where `~` resolves to `node_modules/`

## Install

`npm install stylus-relative-loader stylus --save-dev`

**Important**: in order to have ability use any `stylus` package version,
it won't be installed automatically. So it's required to
add it to `package.json` along with `stylus-relative-loader`.

## Testing

```
npm test
open http://localhost:8080/test/
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.

## Release History
* 2.1.0 - Initial release tracking `stylus-loader@2.1.0`, with fixed relative imports.
* Find pre-fork releases of `stylus-loader` at https://github.com/shama/stylus-loader/releases
