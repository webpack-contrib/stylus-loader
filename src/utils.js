import { klona } from 'klona/full';

function getStylusOptions(loaderContext, loaderOptions) {
  const stylusOptions = klona(
    typeof loaderOptions.stylusOptions === 'function'
      ? loaderOptions.stylusOptions(loaderContext) || {}
      : loaderOptions.stylusOptions || {}
  );

  stylusOptions.filename = loaderContext.resourcePath;

  if (
    typeof stylusOptions.use !== 'undefined' &&
    stylusOptions.use.length > 0
  ) {
    for (const [i, plugin] of Object.entries(stylusOptions.use)) {
      if (typeof plugin === 'string') {
        try {
          // eslint-disable-next-line import/no-dynamic-require,global-require
          stylusOptions.use[i] = require(plugin)();
        } catch (err) {
          stylusOptions.use.splice(i, 1);
          err.message = `Stylus plugin '${plugin}' failed to load. Are you sure it's installed?`;
          loaderContext.emitWarning(err);
        }
      }
    }
  }

  return stylusOptions;
}

function readFile(inputFileSystem, path) {
  return new Promise((resolve, reject) => {
    inputFileSystem.readFile(path, (err, stats) => {
      if (err) {
        reject(err);
      }
      resolve(stats);
    });
  });
}

export { getStylusOptions, readFile };
