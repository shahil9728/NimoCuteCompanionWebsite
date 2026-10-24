// "Guides" and "Compare" dropdowns in the shared nav (partials/nav.html). Hover and keyboard
// focus open them in CSS; this adds click/tap to toggle, and Escape / outside click to close.
export function initExploreMenu() {
  const drops = Array.from(document.querySelectorAll<HTMLElement>('.nav-drop'));
  const set = (drop: HTMLElement, open: boolean) => {
    drop.classList.toggle('open', open);
    drop.querySelector('.nav-drop-btn')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  drops.forEach((drop) => {
    const btn = drop.querySelector<HTMLElement>('.nav-drop-btn');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !drop.classList.contains('open');
      drops.forEach((d) => set(d, false));
      set(drop, open);
    });
    // Leaving with the mouse also closes a menu that was opened by click.
    drop.addEventListener('mouseleave', () => set(drop, false));
  });
  document.addEventListener('click', (e) => {
    drops.forEach((d) => { if (!d.contains(e.target as Node)) set(d, false); });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    drops.forEach((d) => {
      if (!d.classList.contains('open')) return;
      set(d, false);
      d.querySelector<HTMLElement>('.nav-drop-btn')?.focus();
    });
  });
}
