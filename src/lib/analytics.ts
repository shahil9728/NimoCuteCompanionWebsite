// Google Analytics 4 + Google Tag event helpers.
// gtag.js itself is bootstrapped in each page's <head>. This module just
// provides typed, named event helpers used across the site.
// Every event and parameter is listed in README.md ("Google Analytics / Tag").
type Params = Record<string, unknown>;

function send(event: string, params: Params = {}): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, params);
  }
}

// GA4 caps event parameter values at 100 characters.
const cut = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 100);

export const track = {
  waitlistClick: (location: string) => send('waitlist_click', { location }),
  ctaClick:      (cta: string)      => send('cta_click', { cta }),
  buttonClick:   (label: string)    => send('button_click', { label }),
  formSubmit:    (location: string) => send('form_submit', { form: 'waitlist', location }),
  scrollDepth:   (percent: number)  => send('scroll_depth', { percent }),
  nimoPlay:      (gesture: string)  => send('nimo_play', { gesture }),
  nimoMilestone: (name: string)     => send('nimo_milestone', { name }),
  surveyAnswer:  (question: string, answer: string) => send('survey_answer', { question, answer }),
  surveyDone:    (answered: number) => send('survey_complete', { answered }),
  exitPrompt:    (action: string, trigger: string) => send('exit_prompt', { action, trigger }),
  share:         (method: string)   => send('share', { method, content_type: 'waitlist' }),

  // "Watch the film" button (the film isn't out yet; the click shows a teaser dialog).
  watchFilmClick: (location: string) => send('watch_the_film_cta_click', { location }),

  // Waitlist funnel: start typing -> (error) -> join. generate_lead is GA4's recommended
  // event for a sign-up, so it can be marked as a key event and imported into Google Ads.
  formStart:  (location: string) => send('waitlist_form_start', { location }),
  formError:  (location: string, reason: string) => send('waitlist_form_error', { location, reason }),
  lead:       (location: string) => send('generate_lead', { lead_source: location }),
  markJoined: () => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('set', 'user_properties', { waitlist_member: 'yes' });
    }
  },

  // What people look at and pick.
  sectionView:    (section: string) => send('section_view', { section: cut(section) }),
  faqOpen:        (question: string) => send('faq_open', { question: cut(question) }),
  colorwaySelect: (colorway: string) => send('colorway_select', { colorway }),
  emotionSelect:  (emotion: string) => send('emotion_select', { emotion }),

  // Where people go next.
  navClick:     (area: string, label: string, destination: string) => send('nav_click', { area, label: cut(label), destination }),
  navMenuOpen:  (menu: string) => send('nav_menu_open', { menu }),
  contentClick: (area: string, destination: string) => send('content_click', { area, destination }),
  socialClick:  (network: string, area: string) => send('social_click', { network, area }),
  stickyBar:    (action: 'shown' | 'dismiss') => send('sticky_bar', { action }),
};

export type Track = typeof track;
