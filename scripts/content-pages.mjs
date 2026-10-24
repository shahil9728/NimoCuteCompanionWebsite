// SEO content pages: <slug>.html at the project root, served at /<slug>.
// Read by vite.config.ts (build inputs) and scripts/clean-urls.mjs (postbuild).
// Adding a page: create <slug>.html, add the slug here, then add it to
// public/sitemap.xml, public/llms.txt, the Content-Type headers in render.yaml,
// and the nav/footer partials.
export const CONTENT_PAGES = [
  // guides
  'a-day-with-nimo',
  'nimo-desktop-companion',
  'who-is-nimo-for',
  'dashboard-robot-safety',
  // comparisons
  'ai-companion-robots-compared',
  'nimo-vs-emo',
  'nimo-vs-eilik',
  'nimo-vs-vector',
  'nimo-vs-loona',
  'nimo-vs-voice-assistants',
];
