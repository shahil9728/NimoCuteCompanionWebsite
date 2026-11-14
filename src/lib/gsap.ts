/**
 * GSAP is only needed by the playground (src/nimo) and the waitlist count-up, so it is
 * fetched on demand instead of on every page load. Resolves even if the CDN fails:
 * every caller already falls back to jumping straight to the end values.
 */
const GSAP_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
let loading: Promise<void> | null = null;

export function loadGsap(): Promise<void> {
  if (window.gsap) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = GSAP_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
  }
  return loading;
}
