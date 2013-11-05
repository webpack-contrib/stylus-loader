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
		var css = require("!css-loader!../!./fixtures/import-css.styl");
		(typeof css).should.be.eql("string");
		css.should.match(/\.imported-css/);
	});
	it("should import stylus", function() {
		var css = require("!css-loader!../!./fixtures/import-styl.styl");
		(typeof css).should.be.eql("string");
		css.should.match(/\.imported-stylus/);
	});
	it("shouldn't process urls", function() {
		var css = require("!raw-loader!../!./fixtures/urls.styl");
		(typeof css).should.be.eql("string");
		css.should.match(/\url\(\"?img.png\"?\)/);
	});
});