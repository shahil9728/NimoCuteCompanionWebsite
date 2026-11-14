// A small static Nimo drawn like the product (glossy white shell, blue inner ears, black screen,
// white cartoon eyes, pink "///" blush) whose face is picked with data-face on the <svg>:
//   stare · blink · wink · happy · pop · love · grumpy · sad
// Every face part is in the markup once; CSS (.nf in main.css) shows the parts listed in each
// part's data-l for the current face, so switching faces is a single attribute change.
// Used by the "grows with you" cards and the footer Nimo (src/lib/footerNimo.ts).

export type NimoFace = 'stare' | 'blink' | 'wink' | 'happy' | 'pop' | 'love' | 'grumpy' | 'sad';

const EYES = [79, 121];
const eyeOpen = (x: number) =>
  `<g transform="translate(${x} 112)"><circle r="13" fill="#fff"/><circle r="9.5" fill="#1a1d24"/><circle r="6.5" fill="#050608"/>` +
  `<circle cx="-4" cy="-4.5" r="3.8" fill="#fff"/><circle cx="3.6" cy="4" r="1.6" fill="#fff"/></g>`;
const arc = (x: number) => `<path transform="translate(${x} 112)" d="M-11 3 Q0 -9 11 3"/>`;
const flat = (x: number) => `<path transform="translate(${x} 112)" d="M-11 1 H11"/>`;
const HEART = 'M0 9 C-5 5 -12 1 -12 -4 C-12 -9 -8 -12 -4 -12 C-2 -12 -1 -11 0 -9 C1 -11 2 -12 4 -12 C8 -12 12 -9 12 -4 C12 1 5 5 0 9 Z';
const blush = (x: number) => `M${x} 136 l3 -6 M${x + 7} 136 l3 -6 M${x + 14} 136 l3 -6`;
const EAR_OUT = 'M42 80 C38 54 48 30 63 19 C67 16 71 17 73 21 C82 36 88 52 88 68 Z';
const EAR_IN = 'M52 70 C50 52 56 38 64 30 C66 28 68 29 69 31 C75 42 78 54 78 64 Z';

/** `id` keeps the gradient id unique when several Nimos share a page. */
export function nimoArt(id: string, face: NimoFace = 'stare', label = ''): string {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `
<svg class="nf" viewBox="20 14 160 174" data-face="${face}" ${a11y}>
  <defs>
    <radialGradient id="${id}-shell" cx="36%" cy="28%" r="80%">
      <stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#f2f4f6"/><stop offset="1" stop-color="#c3cad3"/>
    </radialGradient>
  </defs>
  <path d="${EAR_OUT}" fill="url(#${id}-shell)"/><path d="${EAR_IN}" fill="#a9c8ee"/>
  <g transform="translate(200 0) scale(-1 1)"><path d="${EAR_OUT}" fill="url(#${id}-shell)"/><path d="${EAR_IN}" fill="#a9c8ee"/></g>
  <circle cx="100" cy="110" r="76" fill="url(#${id}-shell)"/>
  <ellipse cx="100" cy="114" rx="60" ry="41" fill="#e4e8ed"/>
  <ellipse cx="100" cy="114" rx="56" ry="38" fill="#0b0c0f"/>
  <path d="${blush(58)} ${blush(125)}" stroke="#f28ea0" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <g data-l="stare grumpy sad">${EYES.map(eyeOpen).join('')}</g>
  <g data-l="wink">${eyeOpen(79)}<g class="nf-line">${arc(121)}</g></g>
  <g class="nf-line" data-l="happy pop">${EYES.map(arc).join('')}</g>
  <g class="nf-line" data-l="blink">${EYES.map(flat).join('')}</g>
  <g data-l="love" fill="#f28ea0">${EYES.map((x) => `<path transform="translate(${x} 113)" d="${HEART}"/>`).join('')}</g>
  <path data-l="grumpy" fill="#0b0c0f" d="M62 94 H96 V108.5 L62 100.5 Z M104 94 H138 V100.5 L104 108.5 Z"/>
  <path data-l="sad" fill="#0b0c0f" d="M62 94 H96 V100 L62 108 Z M104 94 H138 V108 L104 100 Z"/>
  <path data-l="sad" fill="#a9c8ee" d="M70 124 C72 128 74 131 74 134 A4.5 4.5 0 0 1 65 134 C65 131 67 128 70 124 Z"/>
  <path class="nf-line nf-mouth" data-l="stare blink wink happy love" d="M88 136 q6 7 12 0 q6 7 12 0"/>
  <ellipse data-l="pop" cx="100" cy="138" rx="6.5" ry="7.5" fill="#3a1820" stroke="#fff" stroke-width="3"/>
  <path class="nf-line nf-mouth" data-l="grumpy sad" d="M91 141 Q100 134 109 141"/>
</svg>`;
}
