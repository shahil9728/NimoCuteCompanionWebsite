import { track } from './analytics';
import { miniFace } from '../nimo/miniFace';

// "You're leaving me?" dialog for visitors who haven't joined. Shown at most once per
// session and once every 3 days. Desktop: pointer leaves through the top of the window.
// Phones: a fast flick back up the page after reading, or 45 s on the page.
const SEEN_KEY = 'nimo_exit_at';
const COOLDOWN_MS = 3 * 24 * 3600 * 1000;
const MIN_ON_PAGE_MS = 8000;

export function initExitPrompt(opts: { touch: boolean; lock: () => void; unlock: () => void }) {
  const modal = document.getElementById('exitModal');
  if (!modal) return;
  const face = document.getElementById('xpFace') as HTMLElement;
  const titleEl = document.getElementById('xpTitle') as HTMLElement;
  const textEl = document.getElementById('xpText') as HTMLElement;
  const input = document.getElementById('exit-email') as HTMLInputElement | null;
  face.innerHTML = miniFace('xp', 'sad');
  const svg = () => face.querySelector('.mf') as SVGElement;

  const store = (s: Storage, k: string, v?: string) => { try { if (v === undefined) return s.getItem(k); s.setItem(k, v); } catch (_) { /* private mode */ } return null; };
  let lastFocus: Element | null = null, shown = false;

  function canShow() {
    if (shown || store(localStorage, 'nimo_joined') === '1' || store(sessionStorage, SEEN_KEY)) return false;
    if (Date.now() - Number(store(localStorage, SEEN_KEY) || 0) < COOLDOWN_MS) return false;
    if (performance.now() < MIN_ON_PAGE_MS || document.hidden) return false;
    if (document.querySelector('.modal-overlay.open')) return false;
    const a = document.activeElement;
    return !(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'));
  }

  function show(trigger: string) {
    if (!canShow()) return;
    shown = true;
    store(sessionStorage, SEEN_KEY, '1');
    store(localStorage, SEEN_KEY, String(Date.now()));
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    opts.lock();
    if (!opts.touch && input) window.setTimeout(() => input.focus(), 120);
    track.exitPrompt('shown', trigger);
  }

  function close() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    opts.unlock();
    if (lastFocus && (lastFocus as HTMLElement).focus) (lastFocus as HTMLElement).focus();
  }

  function later() {
    track.exitPrompt('dismiss', 'maybe_later');
    textEl.textContent = "Okay… I'll wait right here for you.";
    window.setTimeout(close, 1300);
  }

  document.getElementById('xpLater')?.addEventListener('click', later);
  document.getElementById('xpClose')?.addEventListener('click', () => { track.exitPrompt('dismiss', 'close'); close(); });
  modal.addEventListener('click', (e) => { if (e.target === modal) { track.exitPrompt('dismiss', 'backdrop'); close(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) { track.exitPrompt('dismiss', 'escape'); close(); } });

  document.addEventListener('nimo:joined', (ev) => {
    shown = true;
    if ((ev as CustomEvent).detail?.loc !== 'exit') return;
    track.exitPrompt('join', '');
    const s = svg();
    if (s) s.setAttribute('class', 'mf mf-happy');
    titleEl.textContent = "Yay! You're taking me with you!";
    window.setTimeout(close, 1200);
  });

  if (!opts.touch) {
    document.addEventListener('mouseout', (e) => { if (!e.relatedTarget && e.clientY <= 0) show('exit_intent'); });
    return;
  }
  let maxY = 0, lastY = window.scrollY, lastT = performance.now();
  window.addEventListener('scroll', () => {
    const y = window.scrollY, t = performance.now(), dt = t - lastT;
    maxY = Math.max(maxY, y);
    if (dt > 0 && dt < 250 && (y - lastY) / dt < -2.5 && maxY > 1400 && y < maxY - 600) show('scroll_up');
    lastY = y; lastT = t;
  }, { passive: true });
  window.setTimeout(() => show('timer'), 45000);
}
