# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [4.3.3](https://github.com/webpack-contrib/stylus-loader/compare/v4.3.2...v4.3.3) (2021-01-15)


### Bug Fixes

* respect the `compress` option ([#303](https://github.com/webpack-contrib/stylus-loader/issues/303)) ([e964abc](https://github.com/webpack-contrib/stylus-loader/commit/e964abcf18147c1a3894e47cc9e8970379ae33e6))

### [4.3.2](https://github.com/webpack-contrib/stylus-loader/compare/v4.3.1...v4.3.2) (2021-01-09)


### Bug Fixes

* convert relative paths to absolute paths in dependencies ([#301](https://github.com/webpack-contrib/stylus-loader/issues/301)) ([3ded080](https://github.com/webpack-contrib/stylus-loader/commit/3ded080fdc0425c3ebdf41f3204a36bae2eaa02c))

### [4.3.1](https://github.com/webpack-contrib/stylus-loader/compare/v4.3.0...v4.3.1) (2020-12-02)


### Bug Fixes

* prevent search nested imports in css files ([#298](https://github.com/webpack-contrib/stylus-loader/issues/298)) ([092e52a](https://github.com/webpack-contrib/stylus-loader/commit/092e52a5463f7997b3a9545bf636f3bee8fd9dd3))

## [4.3.0](https://github.com/webpack-contrib/stylus-loader/compare/v4.2.0...v4.3.0) (2020-11-11)


### Features

* allow the `additionalData` to be async ([0ce3dd8](https://github.com/webpack-contrib/stylus-loader/commit/0ce3dd83cf0b3135272cc6bdb045663c09288fec))

## [4.2.0](https://github.com/webpack-contrib/stylus-loader/compare/v4.1.1...v4.2.0) (2020-10-29)


### Features

* nested webpack resolve in the `import` option ([#295](https://github.com/webpack-contrib/stylus-loader/issues/295)) ([390aeba](https://github.com/webpack-contrib/stylus-loader/commit/390aeba85ab3f29f86e18f9b94d36c403091e560))

### [4.1.1](https://github.com/webpack-contrib/stylus-loader/compare/v4.1.0...v4.1.1) (2020-10-09)

* update `schema-utils`

## [4.1.0](https://github.com/webpack-contrib/stylus-loader/compare/v4.0.0...v4.1.0) (2020-10-02)


### Features

* webpack resolver supports the `import` option ([8bca526](https://github.com/webpack-contrib/stylus-loader/commit/8bca5262b5b3223108d14f8e10617ae6ca8dd85f))


### Bug Fixes

* source maps ([#290](https://github.com/webpack-contrib/stylus-loader/issues/290)) ([1be8169](https://github.com/webpack-contrib/stylus-loader/commit/1be8169c888d1a8e3531e79ebe1e1ef53d7821e7))

## [4.0.0](https://github.com/webpack-contrib/stylus-loader/compare/v3.0.2...v4.0.0) (2020-09-29)


### ⚠ BREAKING CHANGES

* minimum require `Node.js` version is `10.13`, minimum require `webpack` version is `4`
* `stylus` options were moved to `stylusOptions`
* the default value for the `compress` option is `true` in the `production` mode
* the `resolveUrl` option is `{ nocheck: true }` by default
* sourcemaps contain absolute `sources` by default

### Features

* added loader options validation ([#234](https://github.com/webpack-contrib/stylus-loader/issues/234)) ([6980095](https://github.com/webpack-contrib/stylus-loader/commit/6980095a97819a816fb8418d8252b4ee7779eec8))
* added webpack resolver ([#231](https://github.com/webpack-contrib/stylus-loader/issues/231)) ([da566a6](https://github.com/webpack-contrib/stylus-loader/commit/da566a6da8047c5ffaae8b97f075f896e0152486))
* added `compress` option ([5278fb4](https://github.com/webpack-contrib/stylus-loader/commit/5278fb452a7411078839e83a8b045d516683b412))
* added `additionalData` option ([#248](https://github.com/webpack-contrib/stylus-loader/issues/248)) ([9f781b7](https://github.com/webpack-contrib/stylus-loader/commit/9f781b706ab971abdf99440ee1b5d8157206638f))
* added `hoistAtrules` option ([#276](https://github.com/webpack-contrib/stylus-loader/issues/276)) ([90ff982](https://github.com/webpack-contrib/stylus-loader/commit/90ff9822736943a2c03bdcd0d3a4740cd3811484))
* added `lineNumbers` option ([#278](https://github.com/webpack-contrib/stylus-loader/issues/278)) ([637575c](https://github.com/webpack-contrib/stylus-loader/commit/637575c7a7a8e6889df639fa4d0f0255649823dd))
* added `webpackImporter` option ([#244](https://github.com/webpack-contrib/stylus-loader/issues/244)) ([bbe232a](https://github.com/webpack-contrib/stylus-loader/commit/bbe232ad8d363f0d2cb7e55f85f10bd3cd8886e4))
* allow to pass `stylusOptions` using function ([028a759](https://github.com/webpack-contrib/stylus-loader/commit/028a7595e77b2532ee497df52ab8611de69dfd5f))
* allow to define raw parameter ([b5c75ed](https://github.com/webpack-contrib/stylus-loader/commit/b5c75edab99494cb1d3dfad496e409c2930e8027))

### Bug Fixes

* `binop` nodes ([#262](https://github.com/webpack-contrib/stylus-loader/issues/262)) ([538f4ba](https://github.com/webpack-contrib/stylus-loader/commit/538f4ba8d50a97808f6ea97cfcbe569d0b853f46))
* sourcemap ([#249](https://github.com/webpack-contrib/stylus-loader/issues/249)) ([7066583](https://github.com/webpack-contrib/stylus-loader/commit/7066583250e37547d2e666939537a48c92767924))
* glob ([#279](https://github.com/webpack-contrib/stylus-loader/issues/279)) ([409877c](https://github.com/webpack-contrib/stylus-loader/commit/409877cc5f0ee57d4cc20588b1603539491a7f42))
* watching glob
* error reporting ([3233f86](https://github.com/webpack-contrib/stylus-loader/commit/3233f861d4e935e19fbede34127ca1a4c82997d8))

# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.