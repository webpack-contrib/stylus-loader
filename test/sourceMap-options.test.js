import path from "path";
import fs from "fs";

import {
  compile,
  getCodeFromBundle,
  getCodeFromStylus,
  getCompiler,
  getErrors,
  getWarnings,
} from "./helpers";

describe('"sourceMap" options', () => {
  it('should generate source maps when value is "true"', async () => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(testId, {
      sourceMap: true,
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      expect(path.isAbsolute(source)).toBe(true);
      expect(source).toBe(path.normalize(source));
      expect(fs.existsSync(path.resolve(map.sourceRoot, source))).toBe(true);

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replace(/\\/g, "/");
    });

    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when the "devtool" value is "source-map"', async () => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          paths: ["test/fixtures/paths"],
        },
      },
      {
        devtool: "source-map",
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      expect(path.isAbsolute(source)).toBe(true);
      expect(source).toBe(path.normalize(source));
      expect(fs.existsSync(path.resolve(map.sourceRoot, source))).toBe(true);

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replace(/\\/g, "/");
    });

    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when value is "true" and the "devtool" value is "false"', async () => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(
      testId,
      {
        sourceMap: true,
        stylusOptions: {
          paths: ["test/fixtures/paths"],
        },
      },
      {
        devtool: false,
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      expect(path.isAbsolute(source)).toBe(true);
      expect(source).toBe(path.normalize(source));
      expect(fs.existsSync(path.resolve(map.sourceRoot, source))).toBe(true);

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replace(/\\/g, "/");
    });
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should not generate source maps when value is "false"', async () => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(testId, {
      sourceMap: false,
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toBeUndefined();
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should not generate source maps when the "devtool" value is "false"', async () => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(
      testId,
      {
        stylusOptions: {
          paths: ["test/fixtures/paths"],
        },
      },
      {
        devtool: false,
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toBeUndefined();
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should not generate source maps when value is "false" and the "devtool" value is "source-map"', async () => {
    const testId = "./source-map.styl";
    const compiler = getCompiler(
      testId,
      {
        sourceMap: false,
        stylusOptions: {
          paths: ["test/fixtures/paths"],
        },
      },
      {
        devtool: "source-map",
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;
    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toBeUndefined();
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate nested source maps when value is "true"', async () => {
    const testId = "./source-map/index.styl";
    const compiler = getCompiler(testId, {
      sourceMap: true,
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      expect(path.isAbsolute(source)).toBe(true);
      expect(source).toBe(path.normalize(source));
      expect(fs.existsSync(path.resolve(map.sourceRoot, source))).toBe(true);

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replace(/\\/g, "/");
    });

    const codeFromStylus = await getCodeFromStylus(testId, {
      stylusOptions: {
        paths: ["test/fixtures/paths"],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromStylus.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
