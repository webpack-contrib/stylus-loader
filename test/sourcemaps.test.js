var should = require("should");

describe("sourcemaps", function() {
  it("should has correct path in sources property", function() {
    var css = require("!css-loader?sourceMap=true!../?sourceMap=true!./fixtures/sourcemaps/src/parent.styl");
    css.should.have.property('0').
      which.have.property('3').
      which.have.property('sources').
      which.matchAny(/sourcemaps\/src\/inner\/button\/child\.styl/).
      and.matchAny(/sourcemaps\/src\/parent\.styl/);
    /* and paths should start from same location */
    var sources = css[0][3]['sources'];
    var parentBaseLocationLength = sources.find(function (e) {return e.match(/parent\.styl/)}).indexOf('sourcemaps/src/parent.styl');
    var childBaseLocationLength = sources.find(function (e) {return e.match(/child\.styl/)}).indexOf('sourcemaps/src/inner/button/child.styl');
    parentBaseLocationLength.should.eql(childBaseLocationLength, 'length of base path location should be equal');
  });
});
