import { track } from './analytics';
import { saveSurvey } from './supabase';
import { miniFace } from '../nimo/miniFace';

// Four quick questions shown right after a new signup. Answers go to GA (per answer)
// and to the Supabase `waitlist_survey` table (one row, see supabase/waitlist_survey.sql).
type Question = { id: string; title: string; multi?: boolean; options: [string, string][] };

const QUESTIONS: Question[] = [
  {
    id: 'heard_from', title: 'Where did you hear about me?',
    options: [['instagram', 'Instagram'], ['youtube', 'YouTube'], ['x', 'X (Twitter)'], ['ai', 'ChatGPT / AI'],
      ['google', 'Google'], ['friend', 'Friend / WhatsApp'], ['reddit', 'Reddit'], ['other', 'Other']],
  },
  {
    id: 'place', title: 'Where would I live with you?', multi: true,
    options: [['car', 'Car dashboard'], ['desk', 'Work desk'], ['bedside', 'Bedside'], ['gaming', 'Gaming setup'], ['kids', "Kids' room"]],
  },
  {
    id: 'wants', title: 'What should I be best at?', multi: true,
    options: [['company', 'Keeping you company'], ['messages', 'Reading your messages'], ['weather', 'Weather & time'],
      ['breaks', 'Reminding you to take breaks'], ['games', 'Games & reactions'], ['music', 'Music controls']],
  },
  {
    id: 'price', title: 'What price feels fair for me?',
    options: [['under_2k', 'Under ₹2,000'], ['2k_3.5k', '₹2,000–3,500'], ['3.5k_5k', '₹3,500–5,000'], ['5k_8k', '₹5,000–8,000'], ['8k_plus', '₹8,000+']],
  },
];

const SHARE_URL = 'https://www.heynimo.in/?utm_source=whatsapp&utm_medium=share';
const SHARE_TEXT = "I just joined the waitlist for Nimo, a cute AI robot that rides on your car dashboard 🥺 Join me: ";

export function initSurvey(opts: { lock: () => void; unlock: () => void }) {
  const modal = document.getElementById('surveyModal');
  if (!modal) return;
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  const ask = $('svAsk'), done = $('svDone'), stepEl = $('svStep'), title = $('svTitle'), sub = $('svSub');
  const bar = $('svBar'), optionsEl = $('svOptions'), nextBtn = $('svNext') as HTMLButtonElement;
  $('svFace').innerHTML = miniFace('sv', 'happy');

  let email = '', loc = '', step = 0, saved = false, lastFocus: Element | null = null;
  let answers: Record<string, string | string[]> = {};

  function render() {
    const q = QUESTIONS[step];
    stepEl.textContent = `Question ${step + 1} of ${QUESTIONS.length}`;
    title.textContent = q.title;
    sub.hidden = step !== 0;
    bar.style.width = `${(step / QUESTIONS.length) * 100}%`;
    optionsEl.innerHTML = '';
    q.options.forEach(([value, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sv-opt';
      b.textContent = label;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => pick(q, value, b));
      optionsEl.appendChild(b);
    });
    nextBtn.hidden = !q.multi;
    nextBtn.disabled = true;
  }

  function pick(q: Question, value: string, b: HTMLElement) {
    if (q.multi) {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      const list = ((answers[q.id] as string[]) || []).filter((v) => v !== value);
      if (on) list.push(value);
      answers[q.id] = list;
      nextBtn.disabled = !list.length;
      return;
    }
    optionsEl.querySelectorAll('.sv-opt').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    answers[q.id] = value;
    track.surveyAnswer(q.id, value);
    window.setTimeout(next, 260);
  }

  function next() {
    const q = QUESTIONS[step];
    if (q.multi && Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length) track.surveyAnswer(q.id, (answers[q.id] as string[]).join(','));
    step++;
    if (step < QUESTIONS.length) { render(); return; }
    bar.style.width = '100%';
    save();
    track.surveyDone(Object.keys(answers).length);
    ask.hidden = true;
    done.hidden = false;
  }

  function save() {
    const has = (v: string | string[]) => (Array.isArray(v) ? v.length > 0 : !!v);
    if (saved || !Object.keys(answers).some((k) => has(answers[k]))) return;
    saved = true;
    void saveSurvey(email, answers, loc);
  }

  function open(e: string, l: string) {
    if (modal.classList.contains('open')) return;
    email = e; loc = l; step = 0; saved = false; answers = {};
    ask.hidden = false; done.hidden = true;
    render();
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    opts.lock();
    window.setTimeout(() => { const first = optionsEl.querySelector('button') as HTMLElement | null; if (first) first.focus(); }, 80);
  }

  function close() {
    if (!modal.classList.contains('open')) return;
    save();
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    opts.unlock();
    if (lastFocus && (lastFocus as HTMLElement).focus) (lastFocus as HTMLElement).focus();
  }

  nextBtn.addEventListener('click', next);
  $('svSkip').addEventListener('click', next);
  $('svClose').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });

  const wa = $('svWhatsapp') as HTMLAnchorElement;
  wa.href = 'https://wa.me/?text=' + encodeURIComponent(SHARE_TEXT + SHARE_URL);
  wa.addEventListener('click', () => track.share('whatsapp'));
  const copy = $('svCopy');
  copy.addEventListener('click', () => {
    track.share('copy_link');
    const url = SHARE_URL.replace('whatsapp', 'copy');
    const ok = () => { copy.textContent = 'Link copied ✓'; window.setTimeout(() => { copy.textContent = 'Copy link'; }, 1800); };
    try { navigator.clipboard.writeText(url).then(ok, ok); } catch (_) { ok(); }
  });

  document.addEventListener('nimo:joined', (ev) => {
    const d = (ev as CustomEvent).detail || {};
    if (d.already) return;
    window.setTimeout(() => open(d.email || '', d.loc || ''), d.loc === 'exit' ? 1500 : 1100);
  });
}
