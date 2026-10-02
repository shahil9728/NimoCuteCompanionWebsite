import { VB } from './rig';
import type { Pt } from './gestures';

const HEART = '<svg viewBox="-38 -38 76 66"><path fill="currentColor" d="M0 26 C-14 14 -36 2 -36 -14 C-36 -28 -24 -36 -13 -36 C-6 -36 -2 -32 0 -27 C2 -32 6 -36 13 -36 C24 -36 36 -28 36 -14 C36 2 14 14 0 26 Z"/></svg>';
const SPARK = '<svg viewBox="-10 -10 20 20"><path fill="currentColor" d="M0 -10 Q1.6 -1.6 10 0 Q1.6 1.6 0 10 Q-1.6 1.6 -10 0 Q-1.6 -1.6 0 -10Z"/></svg>';
const ANGER = '<svg viewBox="0 0 24 24"><path d="M3 9 Q9 9 9 3 M15 3 Q15 9 21 9 M21 15 Q15 15 15 21 M9 21 Q9 15 3 15" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function createFx(stage: HTMLElement, rect: () => DOMRect, reduce: boolean) {
  const G = window.gsap;
  const layer = document.createElement('div');
  layer.className = 'np-fx';
  layer.setAttribute('aria-hidden', 'true');
  const bubble = document.createElement('div');
  bubble.className = 'np-bubble';
  bubble.setAttribute('aria-hidden', 'true');
  stage.appendChild(layer);
  stage.appendChild(bubble);
  const on = !reduce && !!G;

  const px = (p: Pt) => { const r = rect(); return { x: (p.x / VB) * r.width, y: (p.y / VB) * r.height }; };

  function spawn(html: string, cls: string, p: Pt): HTMLElement | null {
    if (!on || layer.childElementCount > 32) return null;
    const el = document.createElement('span');
    el.className = 'np-p ' + cls;
    el.innerHTML = html;
    const q = px(p);
    G.set(el, { x: q.x, y: q.y });
    layer.appendChild(el);
    return el;
  }
  const done = (el: HTMLElement) => () => el.remove();
  const unit = () => rect().width / VB;

  return {
    hearts(p: Pt, n = 1) {
      for (let i = 0; i < n; i++) {
        const el = spawn(HEART, 'np-heart', { x: p.x + rand(-14, 14), y: p.y - 10 });
        if (!el) return;
        const u = unit();
        G.fromTo(el, { scale: 0.2, opacity: 0, rotation: rand(-20, 20) }, {
          scale: rand(0.7, 1.15), opacity: 1, duration: 0.25, ease: 'back.out(3)',
        });
        G.to(el, { y: `-=${rand(70, 120) * u}`, x: `+=${rand(-30, 30) * u}`, rotation: rand(-25, 25), duration: rand(1, 1.5), ease: 'power1.out' });
        G.to(el, { opacity: 0, duration: 0.45, delay: rand(0.6, 0.9), onComplete: done(el) });
      }
    },
    sparkles(p: Pt, n = 5, spread = 60) {
      const u = unit();
      for (let i = 0; i < n; i++) {
        const el = spawn(SPARK, 'np-spark', p);
        if (!el) return;
        const a = rand(0, Math.PI * 2), r = rand(spread * 0.5, spread) * u;
        G.fromTo(el, { scale: 0, opacity: 1 }, {
          x: `+=${Math.cos(a) * r}`, y: `+=${Math.sin(a) * r}`, scale: rand(0.5, 1), rotation: rand(-90, 90),
          duration: rand(0.45, 0.7), ease: 'power2.out',
        });
        G.to(el, { opacity: 0, scale: 0, duration: 0.3, delay: 0.4, onComplete: done(el) });
      }
    },
    impact(p: Pt, dir: number) {
      const ring = spawn('', 'np-ring', p);
      if (!ring) return;
      G.fromTo(ring, { scale: 0.2, opacity: 0.9 }, { scale: 2.4, opacity: 0, duration: 0.45, ease: 'power2.out', onComplete: done(ring) });
      const u = unit();
      for (let i = 0; i < 6; i++) {
        const el = spawn(SPARK, 'np-spark np-hot', p);
        if (!el) return;
        const a = (dir > 0 ? 0 : Math.PI) + rand(-0.9, 0.9), r = rand(50, 95) * u;
        G.fromTo(el, { scale: 0.3, opacity: 1 }, { x: `+=${Math.cos(a) * r}`, y: `+=${Math.sin(a) * r}`, scale: rand(0.6, 1.1), rotation: rand(-120, 120), duration: 0.5, ease: 'power3.out' });
        G.to(el, { opacity: 0, duration: 0.25, delay: 0.35, onComplete: done(el) });
      }
    },
    zzz() {
      const el = spawn('Z', 'np-z', { x: 268, y: 116 });
      if (!el) return;
      const u = unit();
      G.fromTo(el, { scale: 0.4, opacity: 0 }, { scale: rand(1, 1.5), opacity: 1, duration: 0.6 });
      G.to(el, { x: `+=${rand(40, 70) * u}`, y: `-=${rand(70, 100) * u}`, rotation: rand(-15, 15), duration: 2.2, ease: 'sine.out' });
      G.to(el, { opacity: 0, duration: 0.6, delay: 1.6, onComplete: done(el) });
    },
    anger() {
      const side = Math.random() < 0.5;
      const el = spawn(ANGER, 'np-anger', { x: side ? 104 : 296, y: rand(96, 126) });
      if (!el) return;
      G.fromTo(el, { scale: 0, rotation: rand(-20, 20) }, { scale: rand(1, 1.3), duration: 0.22, ease: 'back.out(4)', yoyo: true, repeat: 3, repeatDelay: 0.05 });
      G.to(el, { opacity: 0, duration: 0.25, delay: 0.95, onComplete: done(el) });
    },
    confetti() {
      const c = { x: 200, y: 200 };
      for (let i = 0; i < 16; i++) {
        const heart = i % 2 === 0;
        const el = spawn(heart ? HEART : SPARK, heart ? 'np-heart' : 'np-spark', c);
        if (!el) return;
        const u = unit(), a = rand(0, Math.PI * 2), r = rand(120, 220) * u;
        G.fromTo(el, { scale: 0, opacity: 1 }, { x: `+=${Math.cos(a) * r}`, y: `+=${Math.sin(a) * r - 30 * u}`, scale: rand(0.7, 1.3), rotation: rand(-180, 180), duration: rand(0.8, 1.2), ease: 'power3.out' });
        G.to(el, { opacity: 0, duration: 0.5, delay: 0.9, onComplete: done(el) });
      }
    },
    say: (() => {
      let hideTimer: number | undefined;
      return (text: string, ms = 1900) => {
        bubble.textContent = text;
        if (hideTimer) clearTimeout(hideTimer);
        if (G && !reduce) {
          G.killTweensOf(bubble);
          G.fromTo(bubble, { opacity: 0, scale: 0.6, y: 8 }, { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: 'back.out(2.4)' });
        } else bubble.style.opacity = '1';
        hideTimer = window.setTimeout(() => {
          if (G && !reduce) G.to(bubble, { opacity: 0, scale: 0.85, duration: 0.25 });
          else bubble.style.opacity = '0';
        }, ms);
      };
    })(),
  };
}

export type Fx = ReturnType<typeof createFx>;
