// "Guides" and "Compare" dropdowns in the shared nav (partials/nav.html).
// Only the `.open` class shows a menu (no CSS :hover / :focus-within), so what you see always
// matches aria-expanded and nothing gets stuck open after a click.
//   Mouse: hover opens; leaving closes after a short grace period, so the pointer can travel
//          from the button down into the menu. A click opens it too (it never toggles shut
//          under the pointer, which used to look like the click did nothing).
//   Touch: tap toggles.
//   Keyboard: Enter/Space toggles, ArrowDown opens and moves into the menu, Escape closes and
//          returns focus to the button, tabbing out of the menu closes it.
//   Anywhere: a click outside closes every menu.
export function initExploreMenu() {
  const drops = Array.from(document.querySelectorAll<HTMLElement>('.nav-drop'));
  if (!drops.length) return;
  const hover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const set = (drop: HTMLElement, open: boolean) => {
    drop.classList.toggle('open', open);
    drop.querySelector('.nav-drop-btn')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  const closeOthers = (keep?: HTMLElement) => drops.forEach((d) => { if (d !== keep) set(d, false); });

  drops.forEach((drop) => {
    const btn = drop.querySelector<HTMLButtonElement>('.nav-drop-btn');
    if (!btn) return;
    const firstLink = () => drop.querySelector<HTMLElement>('.nav-drop-menu a');
    let leaveTimer = 0;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeOthers(drop);
      // detail is 0 for Enter/Space: keyboard users toggle; a mouse click only ever opens.
      const keyboard = e.detail === 0;
      set(drop, keyboard || !hover ? !drop.classList.contains('open') : true);
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown') return;
      e.preventDefault();
      closeOthers(drop);
      set(drop, true);
      firstLink()?.focus();
    });

    if (hover) {
      drop.addEventListener('mouseenter', () => { window.clearTimeout(leaveTimer); closeOthers(drop); set(drop, true); });
      drop.addEventListener('mouseleave', () => { leaveTimer = window.setTimeout(() => set(drop, false), 180); });
    }

    drop.addEventListener('focusout', (e) => {
      const next = e.relatedTarget as Node | null;
      if (next && !drop.contains(next)) set(drop, false);
    });
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
