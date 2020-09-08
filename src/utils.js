export function getOptions(context) {
  if (typeof context.getOptions === 'function') {
    return context.getOptions();
  }

  // eslint-disable-next-line global-require
  return require('loader-utils').getOptions(context);
}

export function isObject(value) {
  return typeof value === 'object' && value !== null;
}

export function castArray(value) {
  if (value == null) {
    return [];
  } else if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

export function readFile(inputFileSystem, path) {
  return new Promise((resolve, reject) => {
    inputFileSystem.readFile(path, (err, stats) => {
      if (err) {
        reject(err);
      }
      resolve(stats);
    });
  });
}
