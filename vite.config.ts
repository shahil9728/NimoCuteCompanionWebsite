import { defineConfig } from 'vite';

// Static build -> ./dist (see render.yaml). assetsInlineLimit:0 keeps
// any referenced assets as files rather than inlining them.
export default defineConfig({
  build: { outDir: 'dist', assetsInlineLimit: 0 },
});
