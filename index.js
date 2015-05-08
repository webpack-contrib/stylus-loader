var loaderUtils = require('loader-utils');
var stylus = require('stylus');
var path = require('path');
var fs = require('fs');

var CachedPathEvaluator = require('./lib/evaluator');
var PathCache = require('./lib/pathcache');
var resolver = require('./lib/resolver');

module.exports = function(source) {
  var self = this;
  this.cacheable && this.cacheable();
  var done = this.async();
  var options = loaderUtils.parseQuery(this.query);
  options.filename = options.filename || this.resourcePath;
  options.Evaluator = CachedPathEvaluator;

  var stylusOptions = this.options.stylus || {};
  options.use = options.use || stylusOptions.use || [];
  options.import = options.import || stylusOptions.import || [];
  options.define = options.define || stylusOptions.define || [];

  if (options.sourceMap != null) {
    options.sourcemap = options.sourceMap;
    delete options.sourceMap;
  }
  else if (this.sourceMap) {
    options.sourcemap = { comment: false };
  }

  var styl = stylus(source, options);
  var paths = [path.dirname(options.filename)];

  function needsArray(value) {
    return (Array.isArray(value)) ? value : [value];
  }

  if (options.paths && !Array.isArray(options.paths)) {
    paths = paths.concat(options.paths);
    options.paths = [options.paths];
  }

  var manualImports = [];
  Object.keys(options).forEach(function(key) {
    var value = options[key];
    if (key === 'use') {
      needsArray(value).forEach(function(plugin) {
        if (typeof plugin === 'function') {
          styl.use(plugin);
        } else {
          throw new Error('Plugin should be a function');
        }
      });
    } else if (key === 'define') {
      for (var defineName in value) {
        styl.define(defineName, value[defineName]);
      }
    } else if (key === 'import') {
      needsArray(value).forEach(function(stylusModule) {
        styl.import(stylusModule);
        manualImports.push(stylusModule);
      });
    } else {
      styl.set(key, value);

      if (key === 'resolve url' && value) {
        styl.define('url', resolver());
      }
    }
  });

  var boundResolvers = PathCache.resolvers(options, this.resolve);
  PathCache.createFromFile(boundResolvers, {}, source, options.filename)
    .then(function(importPathCache) {
      // CachedPathEvaluator will use this PathCache to find its dependencies.
      options.cache = importPathCache;
      importPathCache.allDeps().forEach(function(f) {
        self.addDependency(path.normalize(f));
      });

      styl.render(function(err, css) {
        if (err) done(err);
        else done(null, css, styl.sourcemap);
      });
    })
    .catch(done);
};
