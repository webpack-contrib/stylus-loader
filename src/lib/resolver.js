import path from 'path';

import { parse } from 'url';

import { Compiler, nodes, utils } from 'stylus';

export default function deepResolver(options = {}) {
  // eslint-disable-next-line no-underscore-dangle
  const _paths = options.paths || [];

  function resolver(url) {
    const paths = _paths.concat(this.paths);
    const { filename } = url;

    // Compile the url
    const compiler = new Compiler(url);

    compiler.isURL = true;

    const query = url.nodes
      .map((node) => {
        return compiler.visit(node);
      })
      .join('');

    const components = query.split(/!/g);
    const resolvedFilePath = resolveUrl(components.pop(), this.filename);

    function resolveUrl(urlSegment, name) {
      const parsedUrl = parse(urlSegment);

      const literal = new nodes.Literal(parsedUrl.href);

      // Absolute or hash
      if (
        parsedUrl.protocol ||
        !parsedUrl.pathname ||
        parsedUrl.pathname[0] === '/'
      ) {
        return literal;
      }

      let found;

      // Check that file exists
      if (!options.nocheck) {
        found = utils.lookup(parsedUrl.pathname, paths, '', true);

        if (!found) {
          return parsedUrl.href;
        }
      }

      if (!found) {
        found = parsedUrl.href;
      }

      let tail = '';

      if (parsedUrl.search) {
        tail += parsedUrl.search;
      }
      if (parsedUrl.hash) {
        tail += parsedUrl.hash;
      }

      let result =
        path.relative(
          path.dirname(name),
          options.nocheck ? path.join(path.dirname(filename), found) : found
        ) + tail;

      if (path.sep === '\\') {
        result = result.replace(/\\/g, '/');
      }

      return result;
    }

    components.push(resolvedFilePath);

    return new nodes.Literal(`url("${components.join('!')}")`);
  }

  resolver.options = options;
  resolver.raw = true;

  return resolver;
}
