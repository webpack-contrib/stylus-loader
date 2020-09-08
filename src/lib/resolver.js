import path from 'path';

import { parse } from 'url';

import { Compiler, nodes, utils } from 'stylus';

export default function resolver(options = {}) {
  // eslint-disable-next-line no-underscore-dangle
  const _paths = options.paths || [];

  function url(imported) {
    const paths = _paths.concat(this.paths);
    const { filename } = this;

    // Compile the url
    const compiler = new Compiler(imported);

    compiler.isURL = true;

    const query = imported.nodes
      .map((node) => {
        return compiler.visit(node);
      })
      .join('');

    const components = query.split(/!/g).map((urlSegment) => {
      if (!urlSegment) {
        return urlSegment;
      }

      const parsedUrl = parse(urlSegment);

      if (parsedUrl.protocol) {
        return parsedUrl.href;
      }

      // Lookup
      const found = utils.lookup(parsedUrl.pathname, paths, '', true);
      if (!found) {
        return parsedUrl.href;
      }

      let tail = '';

      if (parsedUrl.search) {
        tail += parsedUrl.search;
      }
      if (parsedUrl.hash) {
        tail += parsedUrl.hash;
      }

      let res = path.relative(path.dirname(filename), found) + tail;

      if (path.sep === '\\') {
        res = res.replace(/\\/g, '/');
      }

      return res;
    });

    return new nodes.Literal(`url("${components.join('!')}")`);
  }

  url.raw = true;

  return url;
}
