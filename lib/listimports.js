var Parser = require('stylus/lib/parser');
var Visitor = require('stylus/lib/visitor');
var nodes = require('stylus/lib/nodes');

module.exports = listImports;

// ImportVisitor is a simple stylus ast visitor that navigates the graph
// building a list of imports in it.
function ImportVisitor() {
  Visitor.apply(this, arguments);
  this.importPaths = [];
}

ImportVisitor.prototype = Object.create(Visitor.prototype);
ImportVisitor.prototype.constructor = ImportVisitor;

ImportVisitor.prototype.visitImport = function(node) {
  this.importPaths.push(node.path.first.string);
  return node;
};

ImportVisitor.prototype.visitRoot = function(block){
  for (var i = 0; i < block.nodes.length; ++i) {
    this.visit(block.nodes[i]);
  }
  return block;
};

ImportVisitor.prototype.visitBlock = ImportVisitor.prototype.visitRoot;

// Returns a list of paths that given source imports.
function listImports(source) {
  // Current idea here is to silence errors and let them rise in stylus's
  // renderer which has more handling so that the error message is more
  // meaningful and easy to understand.
  try {
    var ast = new Parser(source, { cache: false }).parse();
  } catch (e) {
    return [];
  }
  var importVisitor = new ImportVisitor(ast, {});
  importVisitor.visit(ast);
  return importVisitor.importPaths;
}
