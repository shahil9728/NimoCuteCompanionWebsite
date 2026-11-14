import { track } from './analytics';

/* FAQ accordions (home and every guide page): one answer open at a time, opening and closing
   with a short height + fade animation. Built on <details>, so the answers still open without
   JS and stay readable to search engines. Reduced motion switches instantly. */
export function initFaq() {
  const items = Array.from(document.querySelectorAll<HTMLDetailsElement>('.faq details'));
  if (!items.length) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const running = new Map<HTMLDetailsElement, Animation>();
  const isOpen = (d: HTMLDetailsElement) => d.open && d.dataset.closing !== '1';

  function stop(d: HTMLDetailsElement) {
    const a = running.get(d);
    if (a) { a.onfinish = null; a.cancel(); running.delete(d); }
    delete d.dataset.closing;
  }

  function open(d: HTMLDetailsElement) {
    stop(d);
    d.open = true;
    const ans = d.querySelector<HTMLElement>('.ans');
    if (reduce || !ans || !ans.animate) return;
    const cs = getComputedStyle(ans);
    const a = ans.animate(
      [{ height: '0px', paddingBottom: '0px', opacity: 0 }, { height: ans.offsetHeight + 'px', paddingBottom: cs.paddingBottom, opacity: 1 }],
      { duration: 280, easing: 'cubic-bezier(.22,.61,.36,1)' },
    );
    running.set(d, a);
    a.onfinish = () => running.delete(d);
  }

  function close(d: HTMLDetailsElement) {
    stop(d);
    const ans = d.querySelector<HTMLElement>('.ans');
    if (reduce || !ans || !ans.animate) { d.open = false; return; }
    const cs = getComputedStyle(ans);
    d.dataset.closing = '1';
    const a = ans.animate(
      [{ height: ans.offsetHeight + 'px', paddingBottom: cs.paddingBottom, opacity: 1 }, { height: '0px', paddingBottom: '0px', opacity: 0 }],
      { duration: 220, easing: 'cubic-bezier(.4,0,.2,1)' },
    );
    running.set(d, a);
    a.onfinish = () => { running.delete(d); delete d.dataset.closing; d.open = false; };
  }

  items.forEach((d) => {
    const summary = d.querySelector('summary');
    if (!summary) return;
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if (isOpen(d)) { close(d); return; }
      items.forEach((o) => { if (o !== d && isOpen(o)) close(o); });
      open(d);
      track.faqOpen(summary.textContent || '');
    });
  });
}
