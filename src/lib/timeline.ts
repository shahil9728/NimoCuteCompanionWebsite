/* Day timelines on the guide pages (.timeline): as you scroll, a blue line fills down the track
   and each little Nimo "powers up" when the line reaches him. One rAF-throttled scroll handler:
   it reads every position first, then writes, so it never forces an extra layout. The fill is
   a transform (scaleY), so drawing it stays on the compositor. Reduced motion shows it all lit. */
export function initTimeline() {
  const lines = Array.from(document.querySelectorAll<HTMLElement>('.timeline'));
  if (!lines.length) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  lines.forEach((tl) => {
    const moments = Array.from(tl.querySelectorAll<HTMLElement>('.moment'));
    const faces = moments.map((m) => m.querySelector<HTMLElement>('.mini-nimo') || m);
    if (reduce) {
      tl.style.setProperty('--fill', '1');
      moments.forEach((m) => m.classList.add('lit'));
      return;
    }
    tl.classList.add('is-live');

    let queued = false;
    const update = () => {
      queued = false;
      // the "reading line" sits a little below the middle of the screen
      const mark = window.innerHeight * 0.62;
      const box = tl.getBoundingClientRect();
      const centres = faces.map((f) => { const r = f.getBoundingClientRect(); return r.top + r.height / 2; });
      const fill = Math.min(1, Math.max(0, (mark - box.top) / Math.max(1, box.height)));
      tl.style.setProperty('--fill', fill.toFixed(4));
      moments.forEach((m, i) => m.classList.toggle('lit', centres[i] < mark));
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  });
}
