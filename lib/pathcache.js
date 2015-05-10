var path = require('path');
var fs = require('fs');

var Evaluator = require('stylus/lib/visitor/evaluator');
var loaderUtils = require('loader-utils');
var nodes = require('stylus/lib/nodes');
var utils = require('stylus/lib/utils');
var when = require('when');
var whenNodefn = require('when/node/function');

var listImports = require('./listimports');

module.exports = PathCache;

var readFile = whenNodefn.lift(fs.readFile);

// A cache of import paths of a stylus file resolved to their location on disk
// before the stylus file is rendered. With a special evaluator this lets us
// webpack's resolver.
function PathCache(contexts) {
  this.contexts = contexts;

  // Non relative paths are simpler and looked up in this as a fallback
  // to this.context.
  this.simpleContext = {};
  for (var filename in this.contexts) {
    for (var path in this.contexts[filename]) {
      this.simpleContext[path] = this.contexts[filename][path];
    }
  }
}

// Return a promise for a PathCache.
PathCache.create = function(contexts) {
  return when(new PathCache(contexts));
};
PathCache.createFromFile = resolveFileDeep;

// Create a list of ways to resolve paths.
PathCache.resolvers = resolvers;

// Lookup the path in this cache.
PathCache.prototype.find = function(path, filename) {
  if (this.contexts[filename] && this.contexts[filename][path]) {
    return this.contexts[filename][path].path;
  } else if (this.simpleContext[path]) {
    return this.simpleContext[path].path;
  } else if (/.styl$/.test(path)) {
    // A user can specify @import 'something.styl' but if they specify
    // @import 'something' stylus adds .styl, we drop that here to see if we
    // looked for it without .styl.
    return this.find(path.replace(/.styl$/, ''), filename);
  } else {
    return undefined;
  }
};

// Return if the path in this cache is an index file.
PathCache.prototype.isIndex = function(path, filename) {
  if (this.contexts[filename] && this.contexts[filename][path]) {
    return this.contexts[filename][path].index;
  } else {
    return undefined;
  }
};

// Return an array of all imports the original file depends on.
PathCache.prototype.allDeps = function() {
  var deps = [];
  for (var filename in this.contexts) {
    for (var path in this.contexts[filename]) {
      if (this.contexts[filename][path]) {
        deps = deps.concat(this.contexts[filename][path].path);
      }
    }
  }
  return deps;
};

// Create an array of ways to resolve a path.
//
// The resolved paths may be a path or an object specifying path and index
// members. The index member is used later by stylus, we store it at this point.
function resolvers(options, webpackResolver) {
  var evaluator = new Evaluator(nodes.null, options);
  var whenWebpackResolver = whenNodefn.lift(webpackResolver);
  return [
    // Stylus's normal resolver for single files.
    function(context, path) {
      // Stylus adds .styl to paths for normal "paths" lookup if it isn't there.
      if (!/.styl$/.test(path)) {
        path += '.styl';
      }
      return utils.find(path, options.paths, options.filename);
    },
    // Stylus's normal resolver for node_modules packages. Cannot locate paths
    // inside a package.
    function(context, path) {
      // Stylus calls the argument name. If it exists it should match the name
      // of a module in node_modules.
      if (!path) {
        return null;
      }
      var found = utils.lookupIndex(path, options.paths, options.filename);
      if (found) {
        return {path: found, index: true};
      }
    },
    // Fallback to resolving with webpack's configured resovler.
    function(context, path) {
      // Follow the webpack stylesheet idiom of '~path' meaning a path in a
      // modules folder and a unprefixed 'path' meaning a relative path like
      // './path'.
      path = loaderUtils.urlToRequest(path, options.root);
      // First try with a '.styl' extension.
      return whenWebpackResolver(context, path + '.styl')
        // If the user adds ".styl" to resolve.extensions, webpack can find
        // index files like stylus but it uses all of webpack's configuration,
        // by default for example the module could be web_modules.
        .catch(function() { return whenWebpackResolver(context, path); })
        .catch(function() { return null; });
    }
  ];
}

// Run resolvers on one path and return an object with the found path under a
// key of the original path.
//
// Example:
// resolving the path
//   'a/file'
// returns an object
//   {'a/file': {path: ['node_modules/a/file'], index: true}}
function resolveOne(resolvers, context, path) {
  return when
    .reduce(resolvers, function(result, resolver) {
      return result ? result : resolver(context, path);
    }, undefined)
    .then(function(result) {
      result = typeof result === 'string' ? [result] : result;
      result = Array.isArray(result) ? {path: result, index: false} : result;
      var map = {};
      map[path] = result;
      return map;
    });
}

// Run the resolvers on an array of paths and return an object like resolveOne.
function resolveMany(resolvers, context, paths) {
  return when
    .map(paths, resolveOne.bind(null, resolvers, context))
    .then(function(maps) {
      return maps.reduce(function(map, resolvedPaths) {
        Object.keys(resolvedPaths).forEach(function(path) {
          map[path] = resolvedPaths[path];
        });
        return map;
      }, {});
    });
}

// Load a file at fullPath, resolve all of it's imports and report for those.
function resolveFileDeep(resolvers, contexts, source, fullPath) {
  contexts = contexts || {};
  var nestResolve = resolveFileDeep.bind(null, resolvers, contexts, null);
  var context = path.dirname(fullPath);
  return when
    .try(function() {
      if (typeof source === 'string') { return source; }
      return readFile(fullPath, 'utf8');
    })
    .then(listImports)
    .then(resolveMany.bind(null, resolvers, context))
    .then(function(newPaths) {
      // Contexts are the full path since multiple could be in the same folder
      // but different deps.
      contexts[fullPath] = newPaths;
      return when.map(Object.keys(newPaths), function(key) {
        var found = newPaths[key] && newPaths[key].path;
        if (found) {
          return when.map(found, nestResolve);
        }
      });
    })
    .yield(contexts)
    .then(PathCache.create);
}
