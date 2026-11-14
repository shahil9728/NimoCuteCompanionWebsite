// Small static Nimo for dialogs: plain SVG with CSS animations (see .mf-* in main.css).
// Drawn like the real product: glossy white shell, blue inner ears, black screen,
// white cartoon eyes, pink "///" blush and a little cat mouth.
// `id` prefixes the gradient ids so several faces can live on one page.
export function miniFace(id: string, mood: 'sad' | 'happy'): string {
  const eye = (x: number, flip: boolean) => `
    <g class="mf-eye" transform="translate(${x} 112)${flip ? ' scale(-1 1)' : ''}">
      <g class="mf-ball">
        <circle r="14" fill="#fff"/><circle r="10.5" fill="#1a1d24"/><circle r="7" fill="#050608"/>
        <circle cx="-4.5" cy="-5" r="4.2" fill="#fff"/><circle cx="4" cy="4.5" r="1.8" fill="#fff"/>
      </g>
      <path class="mf-lid" d="M-19 -22 H19 V-15 L-19 -5 Z" fill="#0b0c0f"/>
      <path class="mf-arc" d="M-12 4 Q0 -10 12 4" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>
    </g>`;
  const blush = (x: number) => `<path d="M${x} 136 l3 -6 M${x + 7} 136 l3 -6 M${x + 14} 136 l3 -6" stroke="#f28ea0" stroke-width="2.6" stroke-linecap="round"/>`;
  return `
<svg class="mf mf-${mood}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="${id}-shell" cx="36%" cy="28%" r="80%">
      <stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#f2f4f6"/><stop offset="1" stop-color="#c3cad3"/>
    </radialGradient>
  </defs>
  <g class="mf-head">
    <path d="M42 80 C38 54 48 30 63 19 C67 16 71 17 73 21 C82 36 88 52 88 68 Z" fill="url(#${id}-shell)"/>
    <path d="M52 70 C50 52 56 38 64 30 C66 28 68 29 69 31 C75 42 78 54 78 64 Z" fill="#a9c8ee"/>
    <g transform="translate(200 0) scale(-1 1)">
      <path d="M42 80 C38 54 48 30 63 19 C67 16 71 17 73 21 C82 36 88 52 88 68 Z" fill="url(#${id}-shell)"/>
      <path d="M52 70 C50 52 56 38 64 30 C66 28 68 29 69 31 C75 42 78 54 78 64 Z" fill="#a9c8ee"/>
    </g>
    <circle cx="100" cy="110" r="76" fill="url(#${id}-shell)"/>
    <ellipse cx="100" cy="114" rx="60" ry="41" fill="#e4e8ed"/>
    <ellipse cx="100" cy="114" rx="56" ry="38" fill="#0b0c0f"/>
    ${blush(58)}${blush(125)}
    <g class="mf-eyes">${eye(79, false)}${eye(121, true)}</g>
    <path class="mf-m mf-sadm" d="M91 141 Q100 134 109 141" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>
    <path class="mf-m mf-happym" d="M88 136 q6 7 12 0 q6 7 12 0" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="mf-tear" d="M64 124 C67 129 69 132 69 135 A5 5 0 0 1 59 135 C59 132 61 129 64 124 Z" fill="#a9c8ee"/>
  </g>
</svg>`;
}
