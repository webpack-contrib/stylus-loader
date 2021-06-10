/**
 * @jest-environment node
 */

import {
  compile,
  getCodeFromBundle,
  getCodeFromStylus,
  getCompiler,
  getErrors,
  getWarnings,
} from "./helpers";

jest.setTimeout(30000);

describe("implementation option", () => {
  it("should work", async () => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      // eslint-disable-next-line global-require
      implementation: require("stylus"),
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot("css");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work when implementation option is string", async () => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      implementation: require.resolve("stylus"),
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromStylus = await getCodeFromStylus(testId);

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(codeFromBundle.css).toMatchSnapshot("css");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should throw error when unresolved package", async () => {
    const testId = "./basic.styl";
    const compiler = getCompiler(testId, {
      implementation: "unresolved",
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
