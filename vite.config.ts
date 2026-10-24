import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';
// SEO content pages (<slug>.html at the root). scripts/clean-urls.mjs (postbuild)
// copies each to an extensionless file so Render serves it at /<slug>.
import { CONTENT_PAGES } from './scripts/content-pages.mjs';

// <!--#include partials/x.html--> -> that file's contents, in dev and build.
// Every page shares its nav and footer this way; content pages also share head
// tags and dialogs. Partials may include other partials.
function expandIncludes(html: string, depth = 0): string {
  if (depth > 5) throw new Error('nimo-html-includes: includes nested too deep');
  return html.replace(/<!--#include ([\w./-]+)-->/g, (_, file) =>
    expandIncludes(readFileSync(resolve(__dirname, file), 'utf8'), depth + 1));
}
function htmlIncludes(): Plugin {
  return {
    name: 'nimo-html-includes',
    transformIndexHtml: { order: 'pre', handler: (html) => expandIncludes(html) },
  };
}

// Static multi-page build -> ./dist (see render.yaml).
// assetsInlineLimit:0 keeps referenced assets as real files rather than
// inlining them as base64 — inlined images bloat render-blocking CSS and
// cannot be cached, crawled, or served as WebP.
export default defineConfig({
  plugins: [htmlIncludes()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // /privacy and /terms ship verbatim from public/ (see scripts + render.yaml)
        notfound: resolve(__dirname, '404.html'),
        ...Object.fromEntries(CONTENT_PAGES.map((slug) => [slug, resolve(__dirname, `${slug}.html`)])),
      },
    },
  },
});
