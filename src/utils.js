import { klona } from 'klona/full';

function isObject(value) {
  return typeof value === 'object' && value !== null;
}

function castArray(value) {
  if (value == null) {
    return [];
  } else if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

function getStylusOptions(loaderContext, loaderOptions) {
  const options = klona(
    typeof loaderOptions.stylusOptions === 'function'
      ? loaderOptions.stylusOptions(loaderContext) || {}
      : loaderOptions.stylusOptions || {}
  );

  return options;
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

export { isObject, castArray, getStylusOptions, readFile };
