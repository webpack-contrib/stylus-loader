var should = require("should");

describe("basic", function() {
  it("should compile basic stylus", function() {
    var css = require("!raw-loader!../!./fixtures/basic.styl");
    (typeof css).should.be.eql("string");
    css.should.match(/font:\s?12px Helvetica,\s?Arial,\s?sans-serif;/);
    css.should.match(/-webkit-border-radius:\s?5px;/);
  });
  it("shouldn't import css", function() {
    var css = require("!raw-loader!../!./fixtures/import-css.styl");
    (typeof css).should.be.eql("string");
    css.should.not.match(/\.imported-css/);
  });
  it("should import css with the css-loader", function() {
    var css = require("!css-loader!../!./fixtures/import-css.styl").toString();
    (typeof css).should.be.eql("string");
    css.should.match(/\.imported-css/);
  });
  it("should import stylus", function() {
    var css = require("!css-loader!../!./fixtures/import-styl.styl").toString();
    (typeof css).should.be.eql("string");
    css.should.match(/\.imported-stylus/);
  });
  it("shouldn't process urls", function() {
    var css = require("!raw-loader!../!./fixtures/urls.styl");
    (typeof css).should.be.eql("string");
    css.should.match(/\url\(\"?img.png\"?\)/);
  });
  it("with option, should resolve urls relatively", function() {
    var css = require(
      "!raw-loader!../?{\"resolve url\":true}!./fixtures/shallow.styl"
    );
    (typeof css).should.be.eql("string");
    css.should.match(/\url\(\"img.png\"\)/);
    css.should.match(/\url\(\"deep\/deep-img.png\"\)/);
    css.should.match(/\url\(\"!!deep\/deep-img.png\"\)/);
    css.should.match(/\url\(\"file!deep\/deep-img.png\"\)/);
    css.should.match(/\url\(\"file\?foo!deep\/deep-img.png\"\)/);
  });
  it("with paths, find deps and load like normal stylus", function() {
    var css = require(
      "!raw-loader!../?paths[]=./fixtures/paths!./fixtures/import-paths.styl"
    );
    (typeof css).should.be.eql("string");
    css.should.match(/.other/);
    css.should.match(/font-family/);
  });
  it("stylus can find modules in node_modules", function() {
    var css = require("!raw-loader!../!./fixtures/import-fakenib.styl");
    (typeof css).should.be.eql("string");
    css.should.match(/.not-real-nib/);
  });
  it("resolve with webpack if stylus can't find it", function() {
    var css = require("!raw-loader!../!./fixtures/import-webpack.styl");
    (typeof css).should.be.eql("string");
    css.should.match(/.other/);
    css.should.match(/font-size/);
  });
  it("in a nested import load module from paths", function() {
    var css = require(
      "!raw-loader!../?paths=./fixtures/paths!./fixtures/shallow-paths.styl"
    );
    (typeof css).should.be.eql("string");
    css.should.match(/.other/);
    css.should.match(/font-family/);
  });
  it("in a nested import load module from node_modules", function() {
    var css = require("!raw-loader!../!./fixtures/shallow-fakenib.styl");
    (typeof css).should.be.eql("string");
    css.should.match(/.not-real-nib/);
  });
  it("in a nested import load module from webpack", function() {
    var css = require("!raw-loader!../!./fixtures/shallow-webpack.styl");
    (typeof css).should.be.eql("string");
    css.should.match(/.other/);
    css.should.match(/font-size/);
  });
  it("resolves css with webpack but does not import it", function() {
    var css = require("!raw-loader!../!./fixtures/import-webpack-css.styl");
    (typeof css).should.be.eql("string");
    css.should.not.match(/\.imported-css/);
  });
  it("in a nested import resolve css with webpack but not import", function() {
    var css = require("!raw-loader!../!./fixtures/import-webpack-css.styl");
    (typeof css).should.be.eql("string");
    css.should.not.match(/\.imported-css/);
  });
  it("should allow stylus plugins to be configured in webpack.config.js", function() {
    var css = require("!raw-loader!../!./fixtures/webpack.config-plugin.styl");
    (typeof css).should.be.eql("string");
    css.should.match(/width:\s?100%;/);
  });
  it("correctly compiles mixin calls inside imported files", function () {
    var css = require("!raw-loader!../!./fixtures/import-mixins/index.styl");
    (typeof css).should.be.eql("string");
    var regexp = new RegExp('body{color:#639;}.rule{color:#639;}main{color:#639;}');
    css.replace(/\s/g, '').should.match(regexp);
  });
  it("should compile an @import URL through the CSS loader", function () {
    var css = require("!css-loader!../!./fixtures/import-google-font.styl").toString();
    (typeof css).should.be.eql("string");
    css.should.be.eql('@import url(http://fonts.googleapis.com/css?family=Open+Sans:400,700,400italic);\n');
  });
  it("imports files listed in option argument", function() {
    var css = require(
      "!raw-loader!..?import[]=urls.styl!./fixtures/stylus.styl"
    );
    (typeof css).should.be.eql("string");
    css.should.match(/body/);
    css.should.match(/\.imported-stylus/);
  });
  it("imports files in a directory included by a plugin", function() {
    var css = require("!raw-loader!..!./fixtures/import-include.styl");
    (typeof css).should.be.eql("string");
    css.should.match(/.in-include/);
  });
  it("imports files listed in option argument stylus paths style", function() {
    var css = require(
      "!raw-loader" +
      "!..?import[]=in-paths.styl&paths[]=" + __dirname + "/fixtures/paths" +
      "!./fixtures/stylus.styl"
    );
    (typeof css).should.be.eql("string");
    css.should.match(/\.other/);
    css.should.match(/\.imported-stylus/);
  });
  it("imports files listed in option argument webpack style", function() {
    var css = require(
      "!raw-loader!..?import[]=~fakenib!./fixtures/stylus.styl"
    );
    (typeof css).should.be.eql("string");
    css.should.match(/\.not-real-nib/);
    css.should.match(/\.imported-stylus/);
  });
  it("imports files listed in option argument and deps", function() {
    var css = require(
      "!raw-loader!..?import[]=import-styl.styl!./fixtures/basic.styl"
    );
    (typeof css).should.be.eql("string");
    css.should.match(/\.imported-stylus/);
    css.should.match(/a\.button/);
  });
  it("imports files listed in option argument and paths deps", function() {
    var css = require(
      "!raw-loader" +
      "!..?import[]=import-paths.styl&paths[]=" + __dirname + "/fixtures/paths" +
      "!./fixtures/basic.styl"
    );
    (typeof css).should.be.eql("string");
    css.should.match(/\.other/);
    css.should.match(/a\.button/);
  });
  it("imports files listed in option argument and webpack deps", function() {
    var css = require(
      "!raw-loader!..?import[]=import-webpack.styl!./fixtures/basic.styl"
    );
    (typeof css).should.be.eql("string");
    css.should.match(/\.other/);
    css.should.match(/a\.button/);
  });
  it("imports the right file based on context", function() {
    var css = require("!raw-loader!..!./fixtures/context");
    (typeof css).should.be.eql("string");
    css.should.match(/\.a-color/);
    css.should.match(/\.b-color/);
  });
});
