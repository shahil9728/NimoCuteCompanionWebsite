import { track } from './analytics';

// Extra GA4 signals for "how do people see Nimo", shared by the home page and the content
// pages: which sections people actually reach, where they click next (nav, footer, guide
// cards, links in the text, social icons), which menus they open, and whether this
// browser already joined the waitlist (user property, so GA4 can split joined vs not).
export function initInsights() {
  try { if (localStorage.getItem('nimo_joined') === '1') track.markJoined(); } catch (_) { /* private mode */ }

  // Sections and article headings: one section_view each, when its top passes 60% of the
  // screen. A scroll check rather than IntersectionObserver, because a fast flick can carry a
  // short heading past the line between two frames and the observer would never report it.
  let pending = Array.from(document.querySelectorAll<HTMLElement>('main section[aria-label], article.prose > h2'));
  let queued = false;
  const check = () => {
    queued = false;
    const line = window.innerHeight * 0.6;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top > line) return true;
      track.sectionView(el.tagName === 'H2' ? 'h2: ' + el.textContent : el.id || el.getAttribute('aria-label') || 'section');
      return false;
    });
    if (!pending.length) window.removeEventListener('scroll', onScroll);
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(check); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  check();

  // Link clicks, tagged by where on the page they happened.
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest('a') as HTMLAnchorElement | null;
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const area = a.closest('.nav-drop-panel') ? 'nav_menu'
      : a.closest('#mobileMenu') ? 'mobile_menu'
      : a.closest('#nav') ? 'nav'
      : a.closest('footer') ? 'footer'
      : a.closest('.guides') ? 'guide_card'
      : a.closest('article') ? 'article'
      : 'page';
    const social = /x\.com|twitter\.com/.test(href) ? 'x' : /instagram\.com/.test(href) ? 'instagram' : '';
    if (social) { track.socialClick(social, area); return; }
    if (!href.startsWith('/')) return;
    if (area === 'nav' || area === 'nav_menu' || area === 'mobile_menu' || area === 'footer') {
      // dropdown items hold a title <b> plus a description; report the title only
      track.navClick(area, (a.querySelector('b') || a).textContent || '', href);
    } else {
      track.contentClick(area, href);
    }
  }, { capture: true });

  // Opening the Guides / Compare dropdowns.
  document.querySelectorAll('.nav-drop').forEach((d) => {
    let open = false;
    const fire = () => { if (open) return; open = true; track.navMenuOpen((d.querySelector('.nav-drop-btn')?.textContent || '').trim()); };
    d.addEventListener('mouseenter', fire);
    d.addEventListener('focusin', fire);
    d.addEventListener('mouseleave', () => { open = false; });
    d.addEventListener('focusout', (e) => { if (!d.contains((e as FocusEvent).relatedTarget as Node)) open = false; });
  });
}
