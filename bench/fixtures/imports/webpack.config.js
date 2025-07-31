module.exports = {
  context: __dirname,
  entry: "./index.js",
  output: {
    path: require("node:path").join(__dirname, "tmp"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.styl$/,
        use: [
          {
            loader: require("node:path").join(__dirname, "./testLoader.js"),
          },
          {
            loader: require("node:path").join(
              __dirname,
              "../../../dist/cjs.js",
            ),
            options: {},
          },
        ],
      },
    ],
  },
};
