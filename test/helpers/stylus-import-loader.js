var listImports = require('../../lib/listimports');

module.exports = function(content) {
  return 'module.exports = ' + JSON.stringify(listImports(content, {cache: {}})) + ';';
};
