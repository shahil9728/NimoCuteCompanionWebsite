// SVG rig for the playground Nimo. Every moving part is a plain number in
// `P`; GSAP tweens those numbers and `render()` writes them to the SVG once per frame.

export const VB = 400;
export const HEAD = { x: 200, y: 215, r: 150 };
export const EYE_L = { x: 157, y: 222 };
export const EYE_R = { x: 243, y: 222 };
export const EAR_L = { x: 110, y: 60 };
export const EAR_R = { x: 290, y: 60 };
const MOUTH = { x: 200, y: 266 };
const PIVOT = { x: 200, y: 365 };

export type RGB = { r: number; g: number; b: number };
export interface EyeP { w: number; h: number; lidY: number; lidRot: number; botY: number; rot: number; dy: number; blink: number }
export interface MouthP { curve: number; w: number; open: number; wavy: number }

export interface RigParams {
  body: { x: number; y: number; rot: number; sx: number; sy: number };
  earL: { rot: number; sy: number };
  earR: { rot: number; sy: number };
  look: { x: number; y: number };
  eyeL: EyeP;
  eyeR: EyeP;
  heart: number; spiral: number; closed: number; closedCurve: number;
  mouth: MouthP;
  cheeks: number; tear: number; sweat: number; hitL: number; hitR: number; stars: number;
  jitter: number; breath: number; breathRate: number;
  color: RGB;
}

const EAR_OUT = 'M-44 20 C-46 -24 -34 -66 -12 -86 C-6 -91 2 -90 7 -84 C30 -58 46 -24 44 20 Z';
const EAR_IN = 'M-27 8 C-28 -20 -20 -50 -8 -64 C-4 -68 1 -67 4 -63 C18 -44 28 -20 27 8 Z';
const HEART = 'M0 26 C-14 14 -36 2 -36 -14 C-36 -28 -24 -36 -13 -36 C-6 -36 -2 -32 0 -27 C2 -32 6 -36 13 -36 C24 -36 36 -28 36 -14 C36 2 14 14 0 26 Z';
const DROP = 'M0 -8 C4 -2 6.5 2 6.5 5.5 A6.5 6.5 0 0 1 -6.5 5.5 C-6.5 2 -4 -2 0 -8 Z';

function spiralPath(): string {
  let d = '';
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 5;
    const r = 1.5 + 1.55 * a;
    d += (i ? ' L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1);
  }
  return d;
}

function starPath(ro: number, ri: number): string {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? ri : ro;
    d += (i ? ' L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1);
  }
  return d + ' Z';
}

function eyeMarkup(s: 'l' | 'r'): string {
  return `
  <g id="np-eye-${s}">
    <ellipse class="np-halo" fill="url(#np-haloG)"/>
    <g mask="url(#np-mask-${s})">
      <ellipse class="np-ball"/><ellipse class="np-iris"/><ellipse class="np-pupil"/>
      <circle class="np-hl" fill="#fff"/><circle class="np-hl2" fill="#fff"/>
    </g>
    <path class="np-heartEye" d="${HEART}"/>
    <path class="np-spiral" d="${spiralPath()}" fill="none" stroke-width="5.5" stroke-linecap="round"/>
    <path class="np-closed" fill="none" stroke-width="7" stroke-linecap="round"/>
  </g>`;
}

function maskMarkup(s: 'l' | 'r'): string {
  return `
  <mask id="np-mask-${s}" maskUnits="userSpaceOnUse" x="-200" y="-200" width="400" height="400">
    <rect x="-200" y="-200" width="400" height="400" fill="#fff"/>
    <rect class="np-lid" x="-120" width="240" height="300" fill="#000"/>
    <ellipse class="np-bot" fill="#000"/>
  </mask>`;
}

// Three stacked SVGs: the static base, the body (moved with a CSS transform so breathing and knocks
// stay on the GPU compositor), and the dizzy stars. No SVG filters: glows are gradients, cheap to repaint.
const SVG = `
<svg class="np-svg np-back" viewBox="0 0 ${VB} ${VB}" aria-hidden="true" focusable="false">
  <ellipse cx="200" cy="372" rx="165" ry="40" fill="url(#np-baseGlowG)"/>
  <ellipse class="np-base" cx="200" cy="368" rx="124" ry="22"/>
  <ellipse id="np-shadow" cx="200" cy="364" rx="96" ry="11" fill="rgba(0,0,0,.38)"/>
</svg>
<svg class="np-svg np-bodySvg" viewBox="0 0 ${VB} ${VB}" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="np-shellG" cx="36%" cy="28%" r="78%">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e2e7eb"/><stop offset="1" stop-color="#8b97a1"/>
    </radialGradient>
    <radialGradient id="np-visorG" cx="50%" cy="38%" r="70%">
      <stop offset="0" stop-color="#141b24"/><stop offset="1" stop-color="#020305"/>
    </radialGradient>
    <linearGradient id="np-earInG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#aab4bd"/><stop offset="1" stop-color="#d7dde2"/>
    </linearGradient>
    <radialGradient id="np-flushG">
      <stop offset="0" stop-color="#ff5d73" stop-opacity=".8"/><stop offset="1" stop-color="#ff5d73" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="np-glareG">
      <stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="np-cheekG">
      <stop offset="0" stop-color="#ff6fa5" stop-opacity=".9"/><stop offset="1" stop-color="#ff6fa5" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="np-haloG">
      <stop class="np-glowStop" offset="0" stop-opacity=".55"/><stop class="np-glowStop" offset=".5" stop-opacity=".22"/><stop class="np-glowStop" offset="1" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="np-baseGlowG">
      <stop class="np-glowStop" offset="0" stop-opacity=".42"/><stop class="np-glowStop" offset="1" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="np-visorClip"><ellipse cx="200" cy="224" rx="118" ry="80"/></clipPath>
    ${maskMarkup('l')}${maskMarkup('r')}
  </defs>
  <g id="np-head">
    <g id="np-ear-l"><path d="${EAR_OUT}" fill="url(#np-shellG)"/><path d="${EAR_IN}" fill="url(#np-earInG)"/></g>
    <g id="np-ear-r"><path d="${EAR_OUT}" fill="url(#np-shellG)"/><path d="${EAR_IN}" fill="url(#np-earInG)"/></g>
    <circle cx="200" cy="215" r="150" fill="url(#np-shellG)"/>
    <path class="np-seam" d="M51 232 Q200 258 349 232"/>
    <path class="np-seam" d="M200 65 Q207 100 206 142"/>
    <path class="np-seam" d="M206 306 Q207 338 200 365"/>
    <circle class="np-dot" cx="64" cy="238" r="2.6"/><circle class="np-dot" cx="336" cy="238" r="2.6"/>
    <ellipse id="np-hit-l" cx="80" cy="252" rx="48" ry="42" fill="url(#np-flushG)" opacity="0"/>
    <ellipse id="np-hit-r" cx="320" cy="252" rx="48" ry="42" fill="url(#np-flushG)" opacity="0"/>
    <ellipse cx="200" cy="224" rx="124" ry="86" fill="#c3ccd3"/>
    <ellipse cx="200" cy="224" rx="118" ry="80" fill="url(#np-visorG)"/>
    <g clip-path="url(#np-visorClip)">
      <g id="np-face">
        <ellipse id="np-cheek-l" cx="128" cy="258" rx="26" ry="15" fill="url(#np-cheekG)"/>
        <ellipse id="np-cheek-r" cx="272" cy="258" rx="26" ry="15" fill="url(#np-cheekG)"/>
        ${eyeMarkup('l')}${eyeMarkup('r')}
        <g id="np-mouth" transform="translate(${MOUTH.x} ${MOUTH.y})">
          <path id="np-mouthGlow" fill="none" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" opacity=".2"/>
          <path id="np-mouthLine" fill="none" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
          <ellipse id="np-mouthO" stroke-width="4.5"/>
        </g>
      </g>
      <ellipse cx="262" cy="174" rx="40" ry="22" fill="url(#np-glareG)" transform="rotate(-18 262 174)"/>
    </g>
    <g id="np-tearShift"><path id="np-tear" d="${DROP}" fill="#8cefff"/></g>
    <path id="np-sweat" d="${DROP}" fill="#bfefff" stroke="#7fd3ea" stroke-width="1"/>
    <ellipse cx="128" cy="118" rx="36" ry="20" fill="url(#np-glareG)" transform="rotate(-34 128 118)"/>
  </g>
</svg>
<svg class="np-svg np-front" viewBox="0 0 ${VB} ${VB}" aria-hidden="true" focusable="false">
  <path class="np-star" d="${starPath(10, 4.4)}"/><path class="np-star" d="${starPath(10, 4.4)}"/><path class="np-star" d="${starPath(10, 4.4)}"/>
</svg>`;

const f = (n: number) => (Math.round(n * 1000) / 1000).toString();
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const rgb = (c: RGB) => `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;
function mix(a: RGB, b: RGB, t: number): string {
  return `rgb(${Math.round(a.r + (b.r - a.r) * t)},${Math.round(a.g + (b.g - a.g) * t)},${Math.round(a.b + (b.b - a.b) * t)})`;
}
const IRIS_DARK = { r: 2, g: 18, b: 24 };
const PUPIL_DARK = { r: 1, g: 7, b: 10 };

function eye(): EyeP { return { w: 54, h: 56, lidY: 0, lidRot: 0, botY: 0, rot: 0, dy: 0, blink: 1 }; }

export function createRig(stage: HTMLElement, reduce: boolean) {
  stage.insertAdjacentHTML('beforeend', SVG);
  // The back SVG never moves, so it is the reference for pointer -> viewBox mapping.
  const svg = stage.querySelector('.np-back') as SVGSVGElement;
  const bodySvg = stage.querySelector('.np-bodySvg') as SVGSVGElement;
  const $ = (sel: string) => stage.querySelector(sel) as SVGElement;

  // Cached layout box: reading it on every pointer move would force a layout each time.
  let box: DOMRect | null = null;
  const invalidate = () => { box = null; };
  window.addEventListener('scroll', invalidate, { passive: true, capture: true });
  window.addEventListener('resize', invalidate);
  const rect = () => box || (box = svg.getBoundingClientRect());

  const P: RigParams = {
    body: { x: 0, y: 0, rot: 0, sx: 1, sy: 1 },
    earL: { rot: 0, sy: 1 }, earR: { rot: 0, sy: 1 },
    look: { x: 0, y: 0 },
    eyeL: eye(), eyeR: eye(),
    heart: 0, spiral: 0, closed: 0, closedCurve: 1,
    mouth: { curve: 0.45, w: 20, open: 0, wavy: 0 },
    cheeks: 0.2, tear: 0, sweat: 0, hitL: 0, hitR: 0, stars: 0,
    jitter: 0, breath: 0.012, breathRate: 2.1,
    color: hexToRgb('#35e0ff'),
  };

  const el = {
    head: $('#np-head'), earL: $('#np-ear-l'), earR: $('#np-ear-r'),
    face: $('#np-face'), tearShift: $('#np-tearShift'), tear: $('#np-tear'), sweat: $('#np-sweat'),
    hitL: $('#np-hit-l'), hitR: $('#np-hit-r'), cheekL: $('#np-cheek-l'), cheekR: $('#np-cheek-r'),
    mouthLine: $('#np-mouthLine'), mouthGlow: $('#np-mouthGlow'), mouthO: $('#np-mouthO'), shadow: $('#np-shadow'),
    stars: [].slice.call(stage.querySelectorAll('.np-star')) as SVGElement[],
    glowStops: [].slice.call(stage.querySelectorAll('.np-glowStop')) as SVGElement[],
  };

  function eyeEls(s: 'l' | 'r') {
    const g = $('#np-eye-' + s), m = $('#np-mask-' + s);
    return {
      g, halo: g.querySelector('.np-halo') as SVGElement, ballGroup: g.querySelector('[mask]') as SVGElement,
      ball: g.querySelector('.np-ball') as SVGElement, iris: g.querySelector('.np-iris') as SVGElement,
      pupil: g.querySelector('.np-pupil') as SVGElement, hl: g.querySelector('.np-hl') as SVGElement,
      hl2: g.querySelector('.np-hl2') as SVGElement, heart: g.querySelector('.np-heartEye') as SVGElement,
      spiral: g.querySelector('.np-spiral') as SVGElement, closed: g.querySelector('.np-closed') as SVGElement,
      lid: m.querySelector('.np-lid') as SVGElement, bot: m.querySelector('.np-bot') as SVGElement,
    };
  }
  const eyes = { l: eyeEls('l'), r: eyeEls('r') };

  // Only touch the DOM when a value really changed, so an idle Nimo repaints as little as possible.
  const last = new Map<Element, Record<string, string>>();
  const set = (e: Element, k: string, v: string | number) => {
    const s = typeof v === 'number' ? f(v) : v;
    let c = last.get(e);
    if (!c) last.set(e, (c = {}));
    if (c[k] !== s) { c[k] = s; e.setAttribute(k, s); }
  };

  function renderEye(s: 'l' | 'r', E: EyeP, base: { x: number; y: number }, t: number, col: string) {
    const x = eyes[s], m = s === 'l' ? 1 : -1;
    const w = E.w * (1 + (1 - E.blink) * 0.12), h = Math.max(1, E.h * E.blink);
    set(x.g, 'transform', `translate(${f(base.x)} ${f(base.y + E.dy)}) rotate(${f(E.rot * m)})`);

    set(x.halo, 'rx', E.w * 0.95 + 10); set(x.halo, 'ry', Math.max(h, E.h * 0.5) * 0.95 + 10);
    const shapes = 1 - Math.max(P.heart, P.spiral, P.closed);
    set(x.ballGroup, 'opacity', clamp01(shapes));
    set(x.ball, 'rx', w / 2); set(x.ball, 'ry', h / 2); set(x.ball, 'fill', col);
    const px = P.look.x * w * 0.09, py = P.look.y * h * 0.09;
    set(x.iris, 'cx', px * 0.6); set(x.iris, 'cy', py * 0.6); set(x.iris, 'rx', w * 0.35); set(x.iris, 'ry', h * 0.35);
    set(x.iris, 'fill', mix(P.color, IRIS_DARK, 0.62));
    set(x.pupil, 'cx', px); set(x.pupil, 'cy', py); set(x.pupil, 'rx', w * 0.2); set(x.pupil, 'ry', h * 0.2);
    set(x.pupil, 'fill', mix(P.color, PUPIL_DARK, 0.9));
    const hr = Math.min(w, h);
    set(x.hl, 'cx', w * 0.17 + px); set(x.hl, 'cy', -h * 0.19 + py); set(x.hl, 'r', hr * 0.12);
    set(x.hl2, 'cx', -w * 0.14 + px); set(x.hl2, 'cy', h * 0.16 + py); set(x.hl2, 'r', hr * 0.05);
    const hlOp = clamp01((E.blink - 0.35) / 0.65);
    set(x.hl, 'opacity', hlOp * 0.95); set(x.hl2, 'opacity', hlOp * 0.7);

    const edge = -h / 2 + E.lidY * h;
    set(x.lid, 'y', edge - 300);
    set(x.lid, 'transform', `rotate(${f(E.lidRot * m)} 0 ${f(edge)})`);
    const ry = h * 0.6;
    set(x.bot, 'cx', 0); set(x.bot, 'rx', w * 0.95); set(x.bot, 'ry', ry); set(x.bot, 'cy', h / 2 - E.botY * h + ry);

    const beat = 1 + Math.sin(t * 9) * 0.06 * P.heart;
    set(x.heart, 'opacity', P.heart);
    if (P.heart > 0.01) {
      set(x.heart, 'fill', col);
      set(x.heart, 'transform', `scale(${f((E.w / 66) * (0.55 + 0.45 * P.heart) * beat)})`);
    }

    set(x.spiral, 'opacity', P.spiral);
    if (P.spiral > 0.01) {
      set(x.spiral, 'stroke', col);
      set(x.spiral, 'transform', `rotate(${f(t * 420 * m)}) scale(${f((E.w / 54) * (0.5 + 0.5 * P.spiral))})`);
    }

    const k = P.closedCurve * E.h * 0.42;
    set(x.closed, 'opacity', P.closed);
    if (P.closed > 0.01) {
      set(x.closed, 'stroke', col);
      set(x.closed, 'd', `M${f(-E.w / 2)} 0 Q0 ${f(k)} ${f(E.w / 2)} 0`);
    }
  }

  // Breathing integrates its own phase so tweening breathRate never makes the body jump.
  let phase = 0, lastT = 0, lastTf = '';
  bodySvg.style.transformOrigin = `50% ${(PIVOT.y / VB) * 100}%`;
  function render(now: number) {
    const t = reduce ? 0 : now;
    const b = P.body, col = rgb(P.color);
    if (!reduce) phase += (lastT ? Math.min(0.1, now - lastT) : 0) * P.breathRate;
    lastT = now;
    const br = Math.sin(phase) * P.breath;
    const jx = P.jitter ? Math.sin(t * 31) * P.jitter * 0.8 : 0;
    const jr = P.jitter ? Math.sin(t * 38) * P.jitter : 0;
    const k = rect().width / VB;
    const tf = `translate(${f((b.x + jx) * k)}px,${f(b.y * k)}px) rotate(${f(b.rot + jr)}deg) scale(${f(b.sx * (1 - br * 0.5))},${f(b.sy * (1 + br))})`;
    if (tf !== lastTf) { lastTf = tf; bodySvg.style.transform = tf; }
    set(el.head, 'transform', `translate(${f(P.look.x * 5)} ${f(P.look.y * 3)}) rotate(${f(P.look.x * 3)} 200 215)`);
    set(el.earL, 'transform', `translate(132 106) rotate(${f(-24 + P.earL.rot)}) scale(1 ${f(P.earL.sy)})`);
    set(el.earR, 'transform', `translate(268 106) rotate(${f(24 - P.earR.rot)}) scale(-1 ${f(P.earR.sy)})`);

    const fx = P.look.x * 14, fy = P.look.y * 9;
    set(el.face, 'transform', `translate(${f(fx)} ${f(fy)})`);
    renderEye('l', P.eyeL, EYE_L, t, col);
    renderEye('r', P.eyeR, EYE_R, t, col);

    const M = P.mouth, open = clamp01(M.open * 2);
    let d = '';
    for (let i = 0; i <= 12; i++) {
      const u = i / 12 - 0.5, x = u * M.w;
      const y = M.curve * 9 * (1 - 4 * u * u) + M.wavy * 3.2 * Math.sin(u * Math.PI * 4 + t * 12);
      d += (i ? ' L' : 'M') + f(x) + ' ' + f(y);
    }
    set(el.mouthLine, 'd', d); set(el.mouthLine, 'stroke', col); set(el.mouthLine, 'opacity', 1 - open);
    set(el.mouthGlow, 'd', d); set(el.mouthGlow, 'stroke', col); set(el.mouthGlow, 'opacity', 0.2 * (1 - open));
    set(el.mouthO, 'rx', Math.max(5, M.w * 0.32) * (0.7 + 0.3 * M.open)); set(el.mouthO, 'ry', 2 + M.open * 11);
    set(el.mouthO, 'cy', M.open * 3); set(el.mouthO, 'stroke', col); set(el.mouthO, 'fill', mix(P.color, PUPIL_DARK, 0.55));
    set(el.mouthO, 'opacity', open);

    set(el.cheekL, 'opacity', P.cheeks * 0.6); set(el.cheekR, 'opacity', P.cheeks * 0.6);
    set(el.hitL, 'opacity', P.hitL); set(el.hitR, 'opacity', P.hitR);

    const fall = reduce ? 10 : (t * 34) % 46;
    if (P.tear > 0.01) set(el.tearShift, 'transform', `translate(${f(fx + EYE_L.x - 24)} ${f(fy + EYE_L.y + 30 + fall)})`);
    set(el.tear, 'opacity', P.tear * (1 - fall / 46));
    if (P.sweat > 0.01) set(el.sweat, 'transform', `translate(${f(300)} ${f(118 + Math.sin(t * 3) * 2 + (1 - P.sweat) * -10)}) scale(1.5)`);
    set(el.sweat, 'opacity', P.sweat);

    set(el.shadow, 'rx', 96 * (1 + Math.min(0, b.y) / 260)); set(el.shadow, 'opacity', 1 + Math.min(0, b.y) / 160);
    el.glowStops.forEach((g) => set(g, 'stop-color', col));

    el.stars.forEach((s, i) => {
      const a = t * 3.2 + (i * Math.PI * 2) / 3;
      const depth = (Math.sin(a) + 1) / 2;
      set(s, 'opacity', P.stars * (0.55 + 0.45 * depth));
      if (P.stars > 0.01) {
        set(s, 'transform', `translate(${f(200 + b.x + Math.cos(a) * 92)} ${f(56 + b.y + Math.sin(a) * 18)}) scale(${f(0.65 + 0.35 * depth)}) rotate(${f(t * 90)})`);
      }
    });
  }

  return { svg, P, render, rect };
}

export type Rig = ReturnType<typeof createRig>;
