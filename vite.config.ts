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
        privacy: resolve(__dirname, 'privacy/index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
        privacyFlat: resolve(__dirname, 'privacy.html'),
        termsFlat: resolve(__dirname, 'terms.html'),
        notfound: resolve(__dirname, '404.html'),
      },
    },
  },
});
