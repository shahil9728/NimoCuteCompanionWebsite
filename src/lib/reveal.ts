/**
 * One quiet fade-in for content below the fold, driven by a single IntersectionObserver.
 * Content is visible without JS; with reduced motion nothing is hidden at all.
 * Uses the `translate` property so it never fights an element's own `transform`.
 */
export function initReveal(selector: string, exclude?: string) {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target as HTMLElement;
      io.unobserve(el);
      el.addEventListener('transitionend', () => el.classList.remove('will-reveal', 'is-in'), { once: true });
      el.classList.add('is-in');
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  const vh = window.innerHeight;
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    if (exclude && el.closest(exclude)) return;
    // Already on screen at load: leave it alone so nothing above the fold flickers.
    const r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) return;
    el.classList.add('will-reveal');
    io.observe(el);
  });
}
