const fs = require("fs");
const path = require("path");

// eslint-disable-next-line import/no-extraneous-dependencies
const Benchmark = require("benchmark");
// eslint-disable-next-line import/no-extraneous-dependencies
const MemoryFileSystem = require("memory-fs");
const stylus = require("stylus");
const webpack = require("webpack");

const importWebpackConfig = require("./fixtures/imports/webpack.config");

function resolveOnComplete(fn) {
  return () => {
    const _this = this;
    const args = arguments;

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
compiler.outputFileSystem = new MemoryFileSystem();

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
  .then(
    resolveOnComplete(() => {
      const suite = new Benchmark.Suite();
      suite
        .add("Stylus loader", {
          defer: true,
          fn(deferred) {
            compiler.run((error, stats) => {
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
