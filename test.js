const fg = require('fast-glob');

async function test() {
  const entries = await fg(['.editorconfig', '**/index.js'], { dot: true });

  return entries;
}

test().then((result) => console.log(result));
