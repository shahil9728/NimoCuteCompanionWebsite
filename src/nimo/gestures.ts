import { HEAD, EYE_L, EYE_R, EAR_L, EAR_R, VB } from './rig';

export type Pt = { x: number; y: number };
export type Zone = 'earL' | 'earR' | 'eyeL' | 'eyeR' | 'chin' | 'top' | 'face';

export interface GestureHandlers {
  tap(zone: Zone, pt: Pt): void;
  slap(dir: number, power: number, pt: Pt): void;
  pet(pt: Pt): void;
  tickle(pt: Pt): void;
  holdStart(pt: Pt): void;
  holdEnd(ms: number): void;
  move(pt: Pt): void;
  leave(): void;
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

export function zoneAt(p: Pt): Zone | null {
  if (dist(p, EAR_L) < 36) return 'earL';
  if (dist(p, EAR_R) < 36) return 'earR';
  if (dist(p, HEAD) > HEAD.r) return null;
  if (dist(p, EYE_L) < 32) return 'eyeL';
  if (dist(p, EYE_R) < 32) return 'eyeR';
  if (p.y > 262) return 'chin';
  if (p.y < 175) return 'top';
  return 'face';
}

// Distance from the head centre to segment a-b (for fast swipes that jump over the head between events).
function segDist(a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y, len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((HEAD.x - a.x) * dx + (HEAD.y - a.y) * dy) / len)) : 0;
  return Math.hypot(a.x + dx * t - HEAD.x, a.y + dy * t - HEAD.y);
}

// Counts direction reversals on one axis; a stroke back and forth is a pet, a fast small wiggle is a tickle.
class Reversals {
  private last: number | null = null;
  private turn = 0;
  private dir = 0;
  private list: { t: number; amp: number }[] = [];
  feed(v: number, now: number) {
    if (this.last === null) { this.last = this.turn = v; return; }
    const prev = this.last, d = v - prev;
    this.last = v;
    if (Math.abs(d) < 0.8) return;
    const s = d > 0 ? 1 : -1;
    if (this.dir && s !== this.dir) {
      const amp = Math.abs(prev - this.turn);
      if (amp >= 6) this.list.push({ t: now, amp });
      this.turn = prev;
    }
    this.dir = s;
    while (this.list.length && now - this.list[0].t > 1500) this.list.shift();
  }
  recent(now: number, win: number) { return this.list.filter((e) => now - e.t < win); }
  reset() { this.last = null; this.dir = 0; this.list = []; }
}

export function attachGestures(stage: HTMLElement, rect: () => DOMRect, h: GestureHandlers) {
  const rx = new Reversals(), ry = new Reversals();
  let samples: { t: number; x: number; y: number; vb: Pt }[] = [];
  let lastSlap = 0, lastPet = 0, lastTickle = 0;
  let down: { t: number; pt: Pt; id: number } | null = null;
  let moved = 0, holding = false, holdT0 = 0, slappedInPress = false;
  let holdTimer: number | undefined;

  const toVB = (e: PointerEvent): Pt => {
    const r = rect();
    return { x: ((e.clientX - r.left) / r.width) * VB, y: ((e.clientY - r.top) / r.height) * VB };
  };
  const clearHold = () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = undefined; } };
  const resetStroke = () => { rx.reset(); ry.reset(); samples = []; };

  function onDown(e: PointerEvent) {
    if (!e.isPrimary) return;
    const pt = toVB(e);
    if (!zoneAt(pt)) return;
    down = { t: performance.now(), pt, id: e.pointerId };
    moved = 0; slappedInPress = false;
    if (e.pointerType !== 'touch') { try { stage.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } }
    clearHold();
    holdTimer = window.setTimeout(() => {
      if (down && moved < 10 && !slappedInPress) { holding = true; holdT0 = performance.now(); h.holdStart(down.pt); }
    }, 550);
  }

  function onMove(e: PointerEvent) {
    if (!e.isPrimary) return;
    const now = performance.now(), pt = toVB(e);
    h.move(pt);
    if (down) { moved = Math.max(moved, Math.hypot(pt.x - down.pt.x, pt.y - down.pt.y)); if (moved >= 10) clearHold(); }
    if (holding) return;

    const prev = samples[samples.length - 1];
    samples.push({ t: now, x: e.clientX, y: e.clientY, vb: pt });
    while (samples.length > 2 && now - samples[0].t > 90) samples.shift();

    // Slap: a fast swipe through the head.
    const ref = samples.find((s) => now - s.t <= 60) || samples[0];
    const dt = now - ref.t;
    if (prev && dt > 4) {
      const vx = (e.clientX - ref.x) / dt, vy = (e.clientY - ref.y) / dt;
      const speed = Math.hypot(vx, vy), th = e.pointerType === 'mouse' ? 2.0 : 1.0;
      const hit = zoneAt(pt) ? pt : segDist(prev.vb, pt) < HEAD.r * 0.9 ? { x: HEAD.x, y: HEAD.y } : null;
      if (speed > th && hit && now - lastSlap > 550) {
        lastSlap = now; slappedInPress = true; clearHold();
        const dir = Math.abs(vx) > Math.abs(vy) * 0.4 ? Math.sign(vx) : hit.x < HEAD.x ? 1 : -1;
        h.slap(dir, Math.min(1, (speed - th) / (th * 1.2)), hit);
        resetStroke();
        return;
      }
    }

    const zone = zoneAt(pt);
    if (!zone) { rx.reset(); ry.reset(); return; }
    rx.feed(pt.x, now); ry.feed(pt.y, now);
    if (zone === 'chin') {
      const n = rx.recent(now, 900).length + ry.recent(now, 900).length;
      if (n >= 3) { lastTickle = now; h.tickle(pt); }
      return;
    }
    const strokes = (a: { amp: number }[]) => a.length >= 2 && a.reduce((s, x) => s + x.amp, 0) / a.length >= 14;
    if (strokes(rx.recent(now, 1400)) || strokes(ry.recent(now, 1400))) { lastPet = now; h.pet(pt); }
  }

  function onUp(e: PointerEvent) {
    if (!e.isPrimary || !down) return;
    const now = performance.now();
    clearHold();
    if (holding) { holding = false; h.holdEnd(now - holdT0); }
    else if (now - down.t < 320 && moved < 12 && !slappedInPress) {
      const z = zoneAt(down.pt);
      if (z) h.tap(z, down.pt);
    }
    down = null;
  }

  function onCancel() {
    clearHold();
    if (holding) { holding = false; h.holdEnd(performance.now() - holdT0); }
    down = null; resetStroke();
  }

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onCancel);
  stage.addEventListener('pointerleave', (e) => { if (!down) { resetStroke(); h.leave(); } else if (e.pointerType === 'touch') onCancel(); });
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
  stage.addEventListener('dragstart', (e) => e.preventDefault());

  return {
    isPetting: () => performance.now() - lastPet < 450,
    isTickling: () => performance.now() - lastTickle < 500,
    isHolding: () => holding,
  };
}

export type Gestures = ReturnType<typeof attachGestures>;
