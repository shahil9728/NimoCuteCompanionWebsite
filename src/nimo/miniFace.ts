// Small static Nimo for dialogs: plain SVG with CSS animations (see .mf-* in main.css).
// `id` prefixes the gradient ids so several faces can live on one page.
export function miniFace(id: string, mood: 'sad' | 'happy'): string {
  const eye = (x: number, flip: boolean) => `
    <g class="mf-eye" transform="translate(${x} 112)${flip ? ' scale(-1 1)' : ''}">
      <circle r="23" fill="url(#${id}-glow)"/>
      <g class="mf-ball">
        <circle r="14" fill="#35e0ff"/><circle r="9.5" fill="#0b3a46"/><circle r="5.5" fill="#031015"/>
        <circle cx="-4.5" cy="-5" r="4.4" fill="#fff"/><circle cx="4" cy="4.5" r="1.9" fill="#fff"/>
      </g>
      <path class="mf-lid" d="M-19 -22 H19 V-15 L-19 -5 Z" fill="#070a0e"/>
      <path class="mf-arc" d="M-12 4 Q0 -10 12 4" fill="none" stroke="#35e0ff" stroke-width="4.5" stroke-linecap="round"/>
    </g>`;
  return `
<svg class="mf mf-${mood}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="${id}-shell" cx="36%" cy="28%" r="80%">
      <stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#e2e7eb"/><stop offset="1" stop-color="#8b97a1"/>
    </radialGradient>
    <radialGradient id="${id}-glow">
      <stop offset="0" stop-color="#35e0ff" stop-opacity=".45"/><stop offset="1" stop-color="#35e0ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g class="mf-head">
    <path d="M42 80 C38 54 48 30 63 19 C67 16 71 17 73 21 C82 36 88 52 88 68 Z" fill="url(#${id}-shell)"/>
    <path d="M52 70 C50 52 56 38 64 30 C66 28 68 29 69 31 C75 42 78 54 78 64 Z" fill="#b9c2ca"/>
    <g transform="translate(200 0) scale(-1 1)">
      <path d="M42 80 C38 54 48 30 63 19 C67 16 71 17 73 21 C82 36 88 52 88 68 Z" fill="url(#${id}-shell)"/>
      <path d="M52 70 C50 52 56 38 64 30 C66 28 68 29 69 31 C75 42 78 54 78 64 Z" fill="#b9c2ca"/>
    </g>
    <circle cx="100" cy="110" r="76" fill="url(#${id}-shell)"/>
    <ellipse cx="100" cy="114" rx="60" ry="41" fill="#c3ccd3"/>
    <ellipse cx="100" cy="114" rx="56" ry="38" fill="#070a0e"/>
    <ellipse cx="64" cy="132" rx="9" ry="5" fill="#ff6fa5" opacity=".35"/>
    <ellipse cx="136" cy="132" rx="9" ry="5" fill="#ff6fa5" opacity=".35"/>
    <g class="mf-eyes">${eye(79, false)}${eye(121, true)}</g>
    <path class="mf-m mf-sadm" d="M91 141 Q100 134 109 141" fill="none" stroke="#35e0ff" stroke-width="4" stroke-linecap="round"/>
    <path class="mf-m mf-happym" d="M90 136 Q100 146 110 136" fill="none" stroke="#35e0ff" stroke-width="4" stroke-linecap="round"/>
    <path class="mf-tear" d="M64 124 C67 129 69 132 69 135 A5 5 0 0 1 59 135 C59 132 61 129 64 124 Z" fill="#8cefff"/>
  </g>
</svg>`;
}
