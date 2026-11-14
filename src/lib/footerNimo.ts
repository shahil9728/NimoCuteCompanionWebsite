import { nimoArt, type NimoFace } from '../nimo/faceArt';

/* A little Nimo resting on the top edge of the footer. Every so often he rolls along it:
     stare + blink → roll → wink → roll → "pop pop" with confetti → roll → sad → roll home.
   Everything is the Web Animations API on transform/opacity (compositor only, no library).
   He only performs while the footer is on screen and the tab is visible; with reduced
   motion he simply sits and smiles. */
export function initFooterNimo() {
  const host = document.querySelector<HTMLElement>('footer .foot-nimo');
  if (!host || !host.animate) return;
  host.innerHTML = `<div class="fn-mover"><div class="fn-shadow"></div><div class="fn-roll">${nimoArt('footnimo', 'stare')}</div><div class="fn-fx"></div></div>`;
  const mover = host.querySelector<HTMLElement>('.fn-mover')!;
  const roller = host.querySelector<HTMLElement>('.fn-roll')!;
  const art = host.querySelector<SVGElement>('.nf')!;
  const fx = host.querySelector<HTMLElement>('.fn-fx')!;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  let inView = false;
  let wake: (() => void) | null = null;
  const awake = () => inView && !document.hidden;
  const check = () => { if (awake() && wake) { const w = wake; wake = null; w(); } };
  new IntersectionObserver((en) => { inView = en.some((e) => e.isIntersecting); check(); }, { rootMargin: '80px 0px' }).observe(host);
  document.addEventListener('visibilitychange', check);
  const whenAwake = () => (awake() ? Promise.resolve() : new Promise<void>((r) => { wake = r; }));
  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const face = (f: NimoFace) => art.setAttribute('data-face', f);

  let x = 0;
  const size = () => roller.getBoundingClientRect().width;
  const span = () => Math.max(0, host.clientWidth - size());

  // Rolling: slide and spin together. Whole turns only, so he always lands upright and the
  // spin can reset to 0deg afterwards. End states go into plain styles, so finished
  // animations never pile up on the elements.
  async function rollTo(nx: number, ms: number) {
    const dist = nx - x;
    const circ = Math.PI * size() * 0.95;
    const n = Math.max(1, Math.round(Math.abs(dist) / circ)) * Math.sign(dist || 1);
    const ease = 'cubic-bezier(.45,.05,.35,1)';
    const slide = mover.animate([{ transform: `translateX(${x}px)` }, { transform: `translateX(${nx}px)` }], { duration: ms, easing: ease });
    const spin = roller.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${n * 360}deg)` }], { duration: ms, easing: ease });
    mover.style.transform = `translateX(${nx}px)`;
    await Promise.all([slide.finished, spin.finished]);
    x = nx;
  }

  async function blink() { face('blink'); await wait(130); face('stare'); }

  // Little paper "crackers" that pop out of the top of his head and drift down.
  const COLORS = ['#f28ea0', '#a9c8ee', '#2f5f9e', '#f2b33d', '#ffffff'];
  function burst() {
    const s = size();
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('i');
      p.style.background = COLORS[i % COLORS.length];
      fx.appendChild(p);
      const ang = (-150 + Math.random() * 120) * Math.PI / 180;
      const d = s * (0.55 + Math.random() * 0.55);
      const dx = Math.cos(ang) * d, dy = Math.sin(ang) * d;
      const spin = (Math.random() * 2 - 1) * 400;
      p.animate([
        { transform: 'translate(0,0) rotate(0deg) scale(.6)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${spin / 2}deg) scale(1)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx * 1.15}px,${dy + s * 0.5}px) rotate(${spin}deg) scale(.9)`, opacity: 0 },
      ], { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.then(() => p.remove());
    }
  }

  async function show() {
    const w = span();
    face('stare'); await wait(1600); await blink(); await wait(1400);
    await whenAwake();
    face('happy'); await rollTo(w / 3, 1200);
    face('wink'); await wait(1700);
    await whenAwake();
    face('happy'); await rollTo((2 * w) / 3, 1200);
    face('pop'); burst(); await wait(420); burst(); await wait(1600);
    await whenAwake();
    face('happy'); await rollTo(w, 1200);
    face('sad'); await wait(2300);
    await whenAwake();
    face('happy'); await rollTo(0, 2000);
    face('stare'); await wait(2500);
  }

  (async () => {
    for (;;) { await whenAwake(); await show(); }
  })();
}
