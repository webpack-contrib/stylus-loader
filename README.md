# stylus-loader
A [stylus](http://learnboost.github.io/stylus/) loader for [webpack](https://github.com/webpack/webpack).

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

and then `require('./file.style');` will compile and add the CSS to your page.

## Install

`npm install stylus-loader --save-dev`

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.

## Release History
* 0.2.0 - Now tracks dependencies for @import statements making cacheable work
* 0.1.0 - Initial release

## License
Copyright (c) 2013 Kyle Robinson Young  
Licensed under the MIT license.