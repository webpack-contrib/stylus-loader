var loaderUtils = require('loader-utils');
var stylus = require('stylus');
var nib = require('nib');

module.exports = function(source) {
  this.cacheable && this.cacheable();
  var done = this.async();
  var options = loaderUtils.parseQuery(this.query);
  options.filename = options.filename || this.resourcePath;

  var styl = stylus(source);

  function needsArray(value) {
    return (Array.isArray(value)) ? value : [value];
  }

  if (options.paths && !Array.isArray(options.paths)) {
    options.paths = [options.paths];
  }

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
      });
    } else {
      styl.set(key, value);
    }
  });

  // TODO call this.addDependency for each imported stylus file
  //      to fix watch mode
  styl.use(nib());
  styl.render(function(err, css) {
    if (err) done(err);
    else done(null, css);
  });
}
