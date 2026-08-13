import { defineConfig } from 'vite';
import { resolve } from 'path';

// Static multi-page build -> ./dist (see render.yaml).
// assetsInlineLimit:0 keeps referenced assets as real files rather than
// inlining them as base64 — inlined images bloat render-blocking CSS and
// cannot be cached, crawled, or served as WebP.
export default defineConfig({
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // /privacy and /terms ship verbatim from public/ (see scripts + render.yaml)
        notfound: resolve(__dirname, '404.html'),
      },
    },
  },
});
