// Google Analytics 4 + Google Tag event helpers.
// gtag.js itself is bootstrapped in index.html (<head>). This module just
// provides typed, named event helpers used across the site.
type Params = Record<string, unknown>;

function send(event: string, params: Params = {}): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, params);
  }
}

export const track = {
  waitlistClick: (location: string) => send('waitlist_click', { location }),
  ctaClick:      (cta: string)      => send('cta_click', { cta }),
  buttonClick:   (label: string)    => send('button_click', { label }),
  formSubmit:    (location: string) => send('form_submit', { form: 'waitlist', location }),
  scrollDepth:   (percent: number)  => send('scroll_depth', { percent }),
};

export type Track = typeof track;
