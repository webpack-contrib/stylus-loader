function testLoader(content) {
  return `export default ${JSON.stringify(content)}`;
}

module.exports = testLoader;
