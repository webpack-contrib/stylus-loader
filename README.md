# stylus-loader
A [stylus](http://learnboost.github.io/stylus/) loader for [webpack](https://github.com/webpack/webpack).

[![build status](https://secure.travis-ci.org/shama/stylus-loader.svg)](https://travis-ci.org/shama/stylus-loader)
[![NPM version](https://badge.fury.io/js/stylus-loader.svg)](https://badge.fury.io/js/stylus-loader)

## Usage

```js
var css = require('!raw!stylus!./file.styl'); // Just the CSS
var css = require('!css!stylus!./file.styl'); // CSS with processed url(...)s
```

See [css-loader](https://github.com/webpack/css-loader) to see the effect of processed `url(...)`s.

Or within the webpack config:

```js
module: {
  loaders: [{
    test: /\.styl$/,
    loader: 'css-loader!stylus-loader?paths=node_modules/bootstrap-stylus/stylus/'
  }]
}
```

Then you can: `var css = require('./file.styl');`.

Use in tandem with the [style-loader](https://github.com/webpack/style-loader) to add the css rules to your `document`:

```js
module: {
  loaders: [
    { test: /\.styl$/, loader: 'style-loader!css-loader!stylus-loader' }
  ]
}
```

and then `require('./file.styl');` will compile and add the CSS to your page.

`stylus-loader` can also take advantage of webpack's resolve options. With the default options it'll find files in `web_modules` as well as `node_modules`, make sure to prefix any lookup in node_modules with `~`. For example if you have a styles package lookup files in it like `@import '~styles/my-styles`. It can also find stylus files without having the extension specified in the `@import` and index files in folders if webpack is configured for stylus's file extension.

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
    { test: /\.styl$/, loader: 'style-loader!css-loader!stylus-loader' }
  ]
},
stylus: {
  use: [stylus_plugin()]
}
```

## Install

`npm install stylus-loader --save-dev`

## Testing

```
npm test
open http://localhost:8080/test/
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.

## Release History
* 1.3.0 - resolve use() calls (@mzgoddard), manual imports through path cache (@mzgoddard)
* 1.2.0 - files in package.json (@SimenB), test running with testem (@mzgoddard), and some performance changes (@mzgoddard)
* 1.1.0 - Pass through sourceMap option to stylus instead of defaulting to inline. Inherit source-map from devtool (@jordansexton).
* 1.0.0 - Basic source map support (@skozin). Remove nib as dep. stylus is now a direct dep (as peerDependencies are deprecated).
* 0.6.0 - Support loader prefixes when resolving paths (@kpdecker).
* 0.5.0 - Disable Stylus parser caching in listImports (@DaQuirm). Update to stylus@0.49.2 and nib@1.0.4 as peerDependencies (@kompot).
* 0.4.0 - Allow configuration of plugins through webpack config (@bobzoller). Update to stylus 0.47.2 (@shanewilson).
* 0.3.1 - Fix when dependency (@tkellen)
* 0.3.0 - Define url resolver() when "resolve url" option is true (@mzgoddard).
* 0.2.0 - Now tracks dependencies for @import statements making cacheable work. Update stylus dep.
* 0.1.0 - Initial release

## License
Copyright (c) 2014 Kyle Robinson Young  
Licensed under the MIT license.
