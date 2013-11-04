# stylus-loader
A [stylus](http://learnboost.github.io/stylus/) loader for [webpack](https://github.com/webpack/webpack).

## Usage

```js
var css = require('stylus!./file.styl');
```

Or within the webpack config:

```js
module: {
  loaders: [
    { test: /\.styl$/, loader: 'stylus-loader?paths=node_modules/bootstrap-stylus/stylus/,include css=true' }
  ]
}
```

Then you can: `var css = require('./file.styl');`.

Use in tandem with the [style-loader](https://github.com/webpack/style-loader) to add the css rules to your `document`:

```js
module: {
  loaders: [{
    test: /\.styl$/,
    loader: 'style-loader!stylus-loader?paths=node_modules/bootstrap-stylus/stylus/,include css=true'
  }]
}
```

and then `require('./file.style');` will compile and add the CSS to your page.

## Install

`npm install stylus-loader --save-dev`

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.

## Release History
* 0.1.0 - Initial release

## License
Copyright (c) 2013 Kyle Robinson Young  
Licensed under the MIT license.