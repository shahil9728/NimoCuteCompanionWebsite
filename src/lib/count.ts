import { fetchWaitlistCount } from './supabase';

// Shown number = OFFSET + real signups, so it grows by one with every real join.
// Set VITE_WAITLIST_COUNT_OFFSET=0 once the real list is big enough to show on its own.
const OFFSET = Number(import.meta.env.VITE_WAITLIST_COUNT_OFFSET ?? 696) || 0;
const JOINED_KEY = 'nimo_joined';

let shown = OFFSET;
let target = OFFSET;
let tween: { kill(): void } | null = null;

// Rewrite the text only when the number changes: new text nodes count as fresh paint (LCP).
let painted = OFFSET.toLocaleString('en-US'); // matches the number already in the HTML
function paint(n: number) {
  const s = Math.round(n).toLocaleString('en-US');
  if (s === painted) return;
  painted = s;
  document.querySelectorAll('[data-waitlist-count]').forEach((el) => { el.textContent = s; });
}

function animateTo(n: number, pop = false) {
  target = n;
  if (n === shown && !pop) return;
  const els = document.querySelectorAll('[data-waitlist-count]');
  if (pop) els.forEach((el) => { el.classList.remove('bump'); void (el as HTMLElement).offsetWidth; el.classList.add('bump'); });
  const g = window.gsap;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!g || reduce) { shown = n; paint(n); return; }
  if (tween) tween.kill();
  const o = { v: shown };
  tween = g.to(o, { v: n, duration: Math.min(1.6, 0.4 + Math.abs(n - shown) * 0.03), ease: 'power2.out', onUpdate: () => { shown = o.v; paint(o.v); } });
}

export async function initWaitlistCount() {
  let joined = false;
  try { joined = localStorage.getItem(JOINED_KEY) === '1'; } catch (_) { /* private mode */ }
  const real = await fetchWaitlistCount();
  animateTo(real !== null ? OFFSET + real : OFFSET + (joined ? 1 : 0));
}

export function bumpWaitlistCount() {
  try { localStorage.setItem(JOINED_KEY, '1'); } catch (_) { /* private mode */ }
  animateTo(target + 1, true);
}
