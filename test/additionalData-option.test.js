const {
  compile,
  getCodeFromBundle,
  getCompiler,
  getErrors,
  getWarnings,
} = require("./helpers");

describe('"additionalData" option', () => {
  it("should work as a string", async () => {
    const testId = "./additional-data.styl";
    const additionalData = "color = coral";
    const compiler = getCompiler(testId, { additionalData });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot("css");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should as a function", async () => {
    const testId = "./additional-data.styl";
    const additionalData = (content, loaderContext) => {
      const { resourcePath, rootContext } = loaderContext;
      // eslint-disable-next-line global-require
      const relativePath = require("path").relative(rootContext, resourcePath);

      return `
/* RelativePath: ${relativePath}; */

color = coral;
bg = gray;

${content}

.custom-class
  background: bg
        `;
    };
    const compiler = getCompiler(testId, { additionalData });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot("css");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should as an async function", async () => {
    const testId = "./additional-data.styl";
    const additionalData = async (content, loaderContext) => {
      const { resourcePath, rootContext } = loaderContext;
      // eslint-disable-next-line global-require
      const relativePath = require("path").relative(rootContext, resourcePath);

      return `
/* RelativePath: ${relativePath}; */

color = coral;
bg = gray;

${content}

.custom-class
  background: bg
        `;
    };
    const compiler = getCompiler(testId, { additionalData });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot("css");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
