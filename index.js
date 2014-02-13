var loaderUtils = require('loader-utils');
var stylus = require('stylus');
var nib = require('nib');
var path = require('path');
var fs = require('fs');

module.exports = function(source) {
  var self = this;
  this.cacheable && this.cacheable();
  var done = this.async();
  var options = loaderUtils.parseQuery(this.query);
  options.filename = options.filename || this.resourcePath;

  var styl = stylus(source);
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
      needsArray(value).forEach(function(func) {
        if (typeof func === 'function') {
          styl.use(func());
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
    }
  });

  extractImports(source).concat(manualImports).map(function(dep) {
    var filepath = null;
    for (var i = 0; i < paths.length; i++) {
      filepath = path.resolve(paths[i], dep);
      if (!fs.existsSync(filepath)) {
        filepath = path.resolve(paths[i], dep + '.styl');
        if (fs.existsSync(filepath)) break;
      } else {
        break;
      }
    }
    return fs.existsSync(filepath) ? filepath : null;
  }).filter(function(dep) {
    return !!dep;
  }).forEach(function(dep) {
    self.addDependency(dep);
  });

  styl.use(nib());
  styl.render(function(err, css) {
    if (err) done(err);
    else done(null, css);
  });
}

// Not the best way but it works for now
function extractImports(source) {
  var imports = [];
  var regex = /@import *[\'|\"]([^\'|\"]+)*/gi;
  var matches = regex.exec(source);
  if (matches) {
    imports.push(matches[1]);
    while (matches != null) {
      matches = regex.exec(source);
      if (matches) imports.push(matches[1]);
    }
  }
  return imports || [];
}
