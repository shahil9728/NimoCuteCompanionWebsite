// postbuild: give every content page an extensionless twin, dist/<slug>.html -> dist/<slug>.
//
// Render serves a real file before any rewrite, and this service's dashboard still has a
// `/* -> /index.html` catch-all (routes in render.yaml are not synced), so /<slug> only
// works if a file has exactly that name. render.yaml sets its Content-Type to text/html.
// /privacy and /terms use the same trick, but ship pre-made from public/.
import { copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_PAGES } from './content-pages.mjs';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

for (const slug of CONTENT_PAGES) {
  const from = resolve(dist, `${slug}.html`);
  if (!existsSync(from)) {
    console.error(`clean-urls: ${slug}.html is missing from dist`);
    process.exit(1);
  }
  copyFileSync(from, resolve(dist, slug));
}
console.log(`clean-urls: ${CONTENT_PAGES.length} pages -> /${CONTENT_PAGES.join(', /')}`);
