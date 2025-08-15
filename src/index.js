import path from "node:path";

import schema from "./options.json";
import {
  createEvaluator,
  getStylusImplementation,
  getStylusOptions,
  normalizeSourceMap,
  readFile,
  urlResolver,
} from "./utils";

export default async function stylusLoader(source) {
  const options = this.getOptions(schema);
  const callback = this.async();

  let implementation;

  try {
    implementation = getStylusImplementation(this, options.implementation);
  } catch (error) {
    callback(error);

    return;
  }

  if (!implementation) {
    callback(
      new Error(
        `The Stylus implementation "${options.implementation}" not found`,
      ),
    );

    return;
  }

  let data = source;

  if (typeof options.additionalData !== "undefined") {
    data =
      typeof options.additionalData === "function"
        ? await options.additionalData(data, this)
        : `${options.additionalData}\n${data}`;
  }

  let stylusOptions;

  try {
    stylusOptions = getStylusOptions(this, options);
  } catch (err) {
    callback(err);
    return;
  }

  const styl = implementation(data, stylusOptions);

  // include regular CSS on @import
  if (stylusOptions.includeCSS) {
    styl.set("include css", true);
  }

  if (stylusOptions.hoistAtrules) {
    styl.set("hoist atrules", true);
  }

  if (stylusOptions.lineNumbers) {
    styl.set("linenos", true);
  }

  if (stylusOptions.disableCache) {
    styl.set("cache", false);
  }

  const useSourceMap =
    typeof options.sourceMap === "boolean" ? options.sourceMap : this.sourceMap;

  if (useSourceMap || stylusOptions.sourcemap) {
    styl.set(
      "sourcemap",
      useSourceMap
        ? {
            comment: false,
            sourceRoot: stylusOptions.dest,
            basePath: this.rootContext,
          }
        : stylusOptions.sourcemap,
    );
  }

  if (typeof stylusOptions.import !== "undefined") {
    for (const imported of stylusOptions.import) {
      styl.import(imported);
    }
  }

  if (typeof stylusOptions.include !== "undefined") {
    for (const included of stylusOptions.include) {
      styl.include(included);
    }
  }

  if (stylusOptions.resolveURL !== false) {
    styl.define("url", urlResolver(stylusOptions.resolveURL));
  }

  const shouldUseWebpackImporter =
    typeof options.webpackImporter === "boolean"
      ? options.webpackImporter
      : true;

  if (shouldUseWebpackImporter) {
    styl.set("Evaluator", await createEvaluator(this, source, stylusOptions));
  }

  if (typeof stylusOptions.define !== "undefined") {
    const definitions = Array.isArray(stylusOptions.define)
      ? stylusOptions.define
      : Object.entries(stylusOptions.define);

    for (const defined of definitions) {
      styl.define(...defined);
    }
  }

  styl.render(async (error, css) => {
    if (error) {
      if (error.filename) {
        this.addDependency(path.normalize(error.filename));
      }

      const obj = new Error(error.message, { cause: error });

      obj.stack = null;

      callback(obj);

      return;
    }

    if (stylusOptions._imports.length > 0) {
      for (const importData of stylusOptions._imports) {
        if (path.isAbsolute(importData.path)) {
          this.addDependency(
            path.normalize(importData.path.replace(/^\/\/\?\//, "")),
          );
        } else {
          this.addDependency(path.resolve(process.cwd(), importData.path));
        }
      }
    }

    let map = styl.sourcemap;

    if (map && useSourceMap) {
      map = normalizeSourceMap(map, stylusOptions.dest);

      try {
        map.sourcesContent = await Promise.all(
          map.sources.map(async (file) =>
            (await readFile(this.fs, file)).toString(),
          ),
        );
      } catch (err) {
        callback(err);

        return;
      }
    }

    callback(null, css, map);
  });
}
