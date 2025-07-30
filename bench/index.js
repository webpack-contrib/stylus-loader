const fs = require("node:fs");
const path = require("node:path");
const Benchmark = require("benchmark");
const { Volume, createFsFromVolume } = require("memfs");
const stylus = require("stylus");
const webpack = require("webpack");

const importWebpackConfig = require("./fixtures/imports/webpack.config");

function resolveOnComplete(fn) {
  return (...args) => {
    const _this = this;

    return new Promise((resolve) => {
      const result = fn.apply(_this, args);
      result.on("complete", () => {
        resolve();
      });
    });
  };
}

const sourceFile = path.resolve(__dirname, "fixtures", "imports", "index.styl");
const source = fs.readFileSync(sourceFile).toString();

const styl = stylus(source);

const compiler = webpack(importWebpackConfig);

compiler.outputFileSystem = createFsFromVolume(new Volume());

Promise.resolve()
  .then(
    resolveOnComplete(() => {
      const suite = new Benchmark.Suite();
      suite
        .add("Native stylus", {
          defer: true,
          fn(deferred) {
            styl
              .set("filename", sourceFile)
              // eslint-disable-next-line no-unused-vars
              .render((error, css) => {
                if (error) {
                  throw error;
                }

                deferred.resolve();
              });
          },
        })
        .on("cycle", (event) => {
          // eslint-disable-next-line no-console
          console.log(String(event.target));
        })
        .run({ async: true });

      return suite;
    }),
  )
  // eslint-disable-next-line unicorn/prefer-top-level-await
  .then(
    resolveOnComplete(() => {
      const suite = new Benchmark.Suite();
      suite
        .add("Stylus loader", {
          defer: true,
          fn(deferred) {
            compiler.run((error, _stats) => {
              if (error) {
                throw error;
              }

              deferred.resolve();
            });
          },
        })
        .on("cycle", (event) => {
          // eslint-disable-next-line no-console
          console.log(String(event.target));
        })
        .run({ async: true });

      return suite;
    }),
  );
