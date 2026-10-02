import { createRig, hexToRgb, HEAD } from './rig';
import { expr, MOOD_COPY, type Mood } from './expressions';
import { attachGestures, type Pt, type Zone } from './gestures';
import { createFx } from './fx';
import { Brain, loadMemory, saveMemory } from './brain';
import { track } from '../lib/analytics';

const LINES = {
  slap: ['Hey!', 'Ow!', 'Rude!', 'Not the face!', 'What was that for?!'],
  slapAgain: ['Stop it!', "Okay, now I'm mad.", 'Again?! Seriously?'],
  poke: ['Hey. Stop poking.', 'Poke me one more time…', 'Hmph.'],
  tantrum: ["That's IT. Hmph!", 'Not talking to you.'],
  pet: ['Purrr…', 'Mmm, more please', 'Right there ♥'],
  love: ['I like you ♥', 'Best. Human. Ever.'],
  boop: ['Boop!', 'Hehe', 'Beep boop!'],
  ear: ['Hehe, my ear!', 'That tickles!'],
  eye: ['Ow, my eye!', 'Hey, I need that!'],
  tickle: ['Hehe! Stop!', 'Not the chin! Haha'],
  hugEnd: ['I needed that.', 'Again? Again!'],
  wake: ["Huh?! I'm up!", "Wasn't sleeping!"],
  forgive: ["Okay… you're forgiven."],
  back: ['You left me…', 'Where did you go?'],
  attract: ['Pet me?', 'Boop my nose!', "Bet you can't make me grumpy", 'Press & hold for a hug'],
};
const TRICKS = ['pet', 'boop', 'flick', 'hug', 'tickle'];
const CHIP_MOOD: Record<string, Mood> = { happy: 'happy', sleepy: 'sleepy', angry: 'angry', lonely: 'sad' };
const CHIP_OF: Partial<Record<Mood, string>> = {
  happy: 'happy', love: 'happy', sleepy: 'sleepy', yawn: 'sleepy', asleep: 'sleepy', angry: 'angry', furious: 'angry', sad: 'lonely',
};
const CROSS = ['annoyed', 'angry', 'furious'];

const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (n: number) => Math.max(-1, Math.min(1, n));
const nowS = () => performance.now() / 1000;

export function mountPlayground(opts: { reduce: boolean; touch: boolean }) {
  const stage = document.getElementById('faceStage');
  if (!stage) return;
  const G = window.gsap;
  const reduce = opts.reduce;
  const animate = !!G && !reduce;

  const rig = createRig(stage, reduce);
  const P = rig.P;
  const fx = createFx(stage, rig.rect, reduce);
  const brain = new Brain();

  const mem = loadMemory();
  const past = { ...mem };
  mem.visits++;
  let saveTimer: number | undefined;
  const remember = () => { clearTimeout(saveTimer); saveTimer = window.setTimeout(() => saveMemory(mem), 800); };
  remember();
  window.addEventListener('pagehide', () => saveMemory(mem));

  const glow = document.getElementById('faceGlow');
  const titleEl = document.getElementById('emoTitle'), textEl = document.getElementById('emoText');
  const chips = [].slice.call(document.querySelectorAll('.emo-chip')) as HTMLElement[];
  const trickEls = [].slice.call(document.querySelectorAll('.np-trick')) as HTMLElement[];
  const foundEl = document.getElementById('npFound');
  const cta = document.getElementById('npCta'), ctaTitle = document.getElementById('npCtaTitle');

  // GSAP when we can; otherwise jump straight to the end values.
  function to(target: any, vars: Record<string, any>) {
    if (G) {
      G.to(target, { duration: 0.32, ease: 'power3.out', ...vars, ...(reduce ? { duration: 0.12, ease: 'none' } : {}), overwrite: 'auto' });
    } else {
      Object.keys(vars).forEach((k) => { if (k in target) target[k] = vars[k]; });
    }
  }
  const vibrate = (ms: number) => { try { if (opts.touch && navigator.vibrate) navigator.vibrate(ms); } catch (_) { /* unsupported */ } };

  /* ---------- body moves ---------- */
  function squash(k = 1) {
    if (!animate) return;
    G.killTweensOf(P.body, 'sx,sy');
    G.timeline()
      .to(P.body, { sy: 1 - 0.14 * k, sx: 1 + 0.1 * k, duration: 0.07, ease: 'power2.out' })
      .to(P.body, { sy: 1, sx: 1, duration: 0.75, ease: 'elastic.out(1.1, 0.35)' });
  }
  function hop() {
    if (!animate) return;
    G.killTweensOf(P.body, 'y,sx,sy');
    G.timeline()
      .to(P.body, { y: -24, sy: 1.05, sx: 0.96, duration: 0.17, ease: 'power2.out' })
      .to(P.body, { y: 0, sy: 1, sx: 1, duration: 0.6, ease: 'bounce.out' });
  }
  function earTwitch(ear: { rot: number; sy: number }, k = 1) {
    if (!animate) return;
    G.killTweensOf(ear);
    G.timeline()
      .to(ear, { rot: -16 * k, sy: 1 - 0.18 * k, duration: 0.07, ease: 'power2.out' })
      .to(ear, { rot: 0, sy: 1, duration: 0.8, ease: 'elastic.out(1.2, 0.3)' });
  }
  function ears(rot: number, sy: number, d = 0.4) {
    if (!animate) return;
    [P.earL, P.earR].forEach((e) => { G.killTweensOf(e); G.to(e, { rot, sy, duration: d, ease: rot ? 'power2.out' : 'elastic.out(1, 0.4)' }); });
  }
  function knock(dir: number, power: number, pt: Pt) {
    const side = Math.abs(pt.x - HEAD.x) < 20 ? (dir > 0 ? 'hitL' : 'hitR') : pt.x < HEAD.x ? 'hitL' : 'hitR';
    if (!animate) return;
    G.killTweensOf(P.body);
    G.timeline()
      .to(P.body, { rot: dir * (10 + 14 * power), x: dir * (12 + 24 * power), sx: 1.04, sy: 0.96, y: 0, duration: 0.08, ease: 'power2.out' })
      .to(P.body, { rot: 0, x: 0, sx: 1, sy: 1, duration: 1.25, ease: 'elastic.out(1, 0.3)' });
    [[P.earL, -1], [P.earR, 1]].forEach(([e, s]: any) => {
      G.killTweensOf(e);
      G.timeline()
        .to(e, { rot: s * dir * 20, duration: 0.1, delay: 0.03, ease: 'power2.out' })
        .to(e, { rot: 0, sy: 1, duration: 1.1, ease: 'elastic.out(1.2, 0.28)' });
    });
    G.fromTo(P, { [side]: 1 }, { [side]: 0, duration: 1.8, delay: 0.3, ease: 'power1.in' });
  }
  function eyePoke(eye: { blink: number }) {
    if (!animate) return;
    G.killTweensOf(eye, 'blink');
    G.to(eye, { blink: 0.05, duration: 0.06, yoyo: true, repeat: 1, repeatDelay: 0.45 });
  }
  function hugSqueeze(on: boolean) {
    if (!animate) return;
    G.killTweensOf(P.body, 'sx,sy');
    G.to(P.body, on
      ? { sy: 0.93, sx: 1.05, duration: 0.3, ease: 'power2.out' }
      : { sy: 1, sx: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    ears(on ? -10 : 0, on ? 0.9 : 1, on ? 0.3 : 0.8);
  }

  /* ---------- tricks + call to action ---------- */
  const found = new Set(mem.found.filter((t) => TRICKS.indexOf(t) >= 0));
  const seenThisPage = new Set<string>();
  let ctaShown = false;

  function paintTricks() {
    trickEls.forEach((li) => {
      const k = li.getAttribute('data-trick') || '';
      const on = found.has(k);
      li.classList.toggle('found', on);
      if (k === 'tickle' && on) {
        const ic = li.querySelector('.ic'), b = li.querySelector('b'), d = li.querySelector('.d');
        if (ic) ic.textContent = '😆';
        if (b) b.textContent = 'Tickle';
        if (d) d.textContent = 'under the chin';
      }
    });
    if (foundEl) foundEl.textContent = String(found.size);
  }
  function showCta(title: string) {
    if (ctaShown || !cta) return;
    ctaShown = true;
    if (ctaTitle) ctaTitle.textContent = title;
    cta.hidden = false;
    if (G) G.fromTo(cta, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: reduce ? 0.01 : 0.5, ease: 'power3.out' });
    track.nimoMilestone('cta_shown');
  }
  function foundTrick(k: string) {
    if (!seenThisPage.has(k)) { seenThisPage.add(k); track.nimoPlay(k); }
    if (found.has(k)) return;
    found.add(k);
    mem.found = Array.from(found);
    remember();
    paintTricks();
    const li = trickEls.filter((x) => x.getAttribute('data-trick') === k)[0];
    if (li && animate) G.fromTo(li, { scale: 1.18 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    if (found.size === TRICKS.length) {
      fx.confetti();
      window.setTimeout(() => fx.say('You found all my tricks! Best friends ♥', 2800), 450);
      showCta('Best friends unlocked.');
      track.nimoMilestone('all_tricks');
    }
  }
  paintTricks();
  if (found.size === TRICKS.length) showCta('Best friends unlocked.');

  /* ---------- mood ---------- */
  let mood: Mood | '' = '';
  function applyExpression(m: Mood) {
    const e = expr(m);
    to(P.eyeL, { ...e.eye, duration: 0.34, ease: 'back.out(1.6)' });
    to(P.eyeR, { ...e.eyeR, duration: 0.34, ease: 'back.out(1.6)' });
    to(P.mouth, { ...e.mouth, duration: 0.3 });
    to(P, {
      heart: e.heart, spiral: e.spiral, closed: e.closed, closedCurve: e.closedCurve, cheeks: e.cheeks,
      tear: e.tear, sweat: e.sweat, stars: e.stars, breath: e.breath, breathRate: e.breathRate, duration: 0.28,
    });
    const c = hexToRgb(e.color);
    to(P.color, { r: c.r, g: c.g, b: c.b, duration: 0.45, ease: 'power2.out' });
    if (glow) glow.style.background = `radial-gradient(circle,rgba(${c.r},${c.g},${c.b},.34),rgba(${c.r},${c.g},${c.b},.1) 42%,transparent 68%)`;
  }
  function setMood(m: Mood, now: number) {
    if (m === mood) return;
    const prev = mood;
    mood = m;
    applyExpression(m);
    if (titleEl) titleEl.textContent = MOOD_COPY[m].title;
    if (textEl) textEl.textContent = MOOD_COPY[m].text;
    const chip = CHIP_OF[m];
    chips.forEach((c) => c.setAttribute('aria-pressed', c.getAttribute('data-emo') === chip ? 'true' : 'false'));

    if (m === 'love') { fx.say(pick(LINES.love)); showCta('He likes you.'); track.nimoMilestone('love'); }
    if ((m === 'happy' || m === 'love') && CROSS.indexOf(prev) >= 0 && (brain.petting || brain.holding)) fx.say(LINES.forgive[0]);
    if (m === 'sleepy' && brain.idle > 12 && prev !== 'yawn') brain.set('yawn', 1.4, now);
    if (m === 'asleep') { fx.say('Zzz…', 1400); ears(-6, 0.92, 1.2); }
    if (prev === 'asleep') ears(0, 1);
    if (m === 'furious') { brain.awayUntil = now + 3.5; track.nimoMilestone('furious'); }
  }

  /* ---------- input ---------- */
  let pointer: Pt | null = null, pointerT = 0, interacted = false;
  let heartT = 0, sparkT = 0, petSayT = 0, tickleSayT = 0, holdPt: Pt = { x: 200, y: 200 };

  function activity(now: number) {
    if (mood === 'asleep') { brain.set('surprised', 0.9, now); hop(); fx.say(pick(LINES.wake)); }
    brain.idle = 0;
  }
  function touched(now: number) { interacted = true; activity(now); }

  function onTap(zone: Zone, pt: Pt) {
    const now = nowS();
    touched(now);
    foundTrick('boop');
    mem.boops++; remember();
    const n = brain.tap(now);
    if (n >= 7) { brain.set('furious', 2.2, now); brain.awayUntil = now + 3.5; fx.say(pick(LINES.tantrum)); squash(0.6); vibrate(40); return; }
    if (n >= 4) { if (n === 4) fx.say(pick(LINES.poke)); brain.set('annoyed', 0.9, now); squash(0.5); fx.anger(); return; }
    if (zone === 'earL' || zone === 'earR') {
      earTwitch(zone === 'earL' ? P.earL : P.earR);
      brain.set('happy', 0.8, now); fx.say(pick(LINES.ear), 1300); return;
    }
    if (zone === 'eyeL' || zone === 'eyeR') {
      eyePoke(zone === 'eyeL' ? P.eyeL : P.eyeR);
      brain.annoy = Math.min(1, brain.annoy + 0.12);
      brain.set('annoyed', 0.9, now); fx.say(pick(LINES.eye), 1300); vibrate(15); return;
    }
    brain.set('excited', 0.65, now);
    squash(1);
    fx.sparkles(pt, 5);
    if (Math.random() < 0.6) fx.say(pick(LINES.boop), 1200);
    vibrate(12);
  }

  const gest = attachGestures(stage, rig.rect, {
    move(pt) { pointer = pt; pointerT = nowS(); activity(pointerT); },
    leave() { /* look falls back to idle glances */ },
    tap: onTap,
    slap(dir, power, pt) {
      const now = nowS();
      touched(now);
      foundTrick('flick');
      mem.slaps++; remember();
      const wasCross = brain.annoy > 0.55;
      brain.slap(power, now);
      if (brain.annoy > 0.92) brain.awayUntil = now + 3.5;
      knock(dir, power, pt);
      fx.impact(pt, dir);
      fx.say(pick(wasCross ? LINES.slapAgain : LINES.slap), 1500);
      vibrate(30);
    },
    pet(pt) {
      const now = nowS();
      touched(now);
      foundTrick('pet');
      if (now > heartT) { fx.hearts(pt); heartT = now + 0.32; }
    },
    tickle(pt) {
      const now = nowS();
      touched(now);
      foundTrick('tickle');
      if (now > sparkT) { fx.sparkles(pt, 3, 40); sparkT = now + 0.25; }
      if (now > tickleSayT) { fx.say(pick(LINES.tickle), 1400); tickleSayT = now + 3; mem.tickles++; remember(); }
    },
    holdStart(pt) {
      const now = nowS();
      touched(now);
      foundTrick('hug');
      mem.hugs++; remember();
      holdPt = pt;
      hugSqueeze(true);
      fx.say('Aww…', 1500);
      vibrate(20);
    },
    holdEnd(ms) {
      hugSqueeze(false);
      if (ms > 0.6) {
        hop();
        brain.joy = Math.max(brain.joy, 0.6);
        fx.say(pick(LINES.hugEnd), 1600);
      }
    },
  });

  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap('face', { x: 200, y: 250 }); }
  });

  chips.forEach((c) => {
    c.addEventListener('click', () => {
      const m = CHIP_MOOD[c.getAttribute('data-emo') || ''];
      if (!m) return;
      const now = nowS();
      touched(now);
      brain.set(m, 4, now);
      if (m === 'angry') fx.anger();
      track.buttonClick('emotion:' + c.getAttribute('data-emo'));
    });
  });

  let mouse: { x: number; y: number; t: number } | null = null, mouseSeen = 0;
  if (!opts.touch) {
    window.addEventListener('mousemove', (e) => { mouse = { x: e.clientX, y: e.clientY, t: nowS() }; }, { passive: true });
  }

  /* ---------- frame loop ---------- */
  let blinkT = 0, sacT = 0, earT = 0, zzzT = 0, angerT = 0, attractT = 0, attractN = 0;
  let sac = { x: 0, y: 0 };
  let wasPetting = false;

  function step(now: number, dt: number) {
    brain.petting = gest.isPetting();
    brain.tickling = gest.isTickling();
    brain.holding = gest.isHolding();

    if (brain.petting !== wasPetting) {
      wasPetting = brain.petting;
      if (wasPetting) {
        mem.pets++; remember();
        ears(-9, 0.9);
        if (now > petSayT) { fx.say(pick(LINES.pet), 1500); petSayT = now + 4; }
      } else if (!brain.holding) ears(0, 1, 0.8);
    }

    if (mouse && mouse.t !== mouseSeen) {
      mouseSeen = mouse.t;
      const r = rig.rect();
      pointer = { x: ((mouse.x - r.left) / r.width) * 400, y: ((mouse.y - r.top) / r.height) * 400 };
      pointerT = mouse.t;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (Math.hypot(mouse.x - cx, mouse.y - cy) < r.width * 1.1) activity(now);
    }

    brain.update(dt);
    setMood(brain.mood(now), now);

    if (mood === 'asleep' && now > zzzT) { fx.zzz(); zzzT = now + 1.5; }
    if ((mood === 'angry' || mood === 'furious') && now > angerT) { fx.anger(); angerT = now + (mood === 'furious' ? 0.7 : 1.3); }
    if (brain.holding && now > heartT) { fx.hearts({ x: holdPt.x, y: holdPt.y - 20 }, 1); heartT = now + 0.28; }

    if (!animate) return;

    const jTarget = mood === 'furious' ? 1.6 : brain.tickling ? 2.6 : 0;
    P.jitter += (jTarget - P.jitter) * Math.min(1, dt * 8);

    let target = sac, k = 16;
    if (now < brain.awayUntil) {
      target = { x: pointer && pointer.x > HEAD.x ? -1 : 1, y: 0.15 }; k = 6;
    } else if (mood === 'asleep') {
      target = { x: 0, y: 0.3 }; k = 3;
    } else if (pointer && now - pointerT < 2.5) {
      target = { x: clamp((pointer.x - HEAD.x) / 260), y: clamp((pointer.y - HEAD.y) / 260) }; k = 10;
    } else if (now > sacT) {
      sacT = now + rand(0.7, 2.4);
      sac = Math.random() < 0.3 ? { x: 0, y: 0 } : { x: rand(-0.7, 0.7), y: rand(-0.45, 0.35) };
    }
    P.look.x += (target.x - P.look.x) * Math.min(1, dt * k);
    P.look.y += (target.y - P.look.y) * Math.min(1, dt * k);

    if (now > blinkT) {
      blinkT = now + rand(2.2, 5.5);
      if (P.closed < 0.5 && P.heart < 0.5 && P.spiral < 0.5) {
        G.to([P.eyeL, P.eyeR], { blink: 0.06, duration: 0.06, ease: 'power1.in', yoyo: true, repeat: Math.random() < 0.2 ? 3 : 1, repeatDelay: 0.03 });
      }
    }
    if (now > earT) {
      earT = now + rand(4, 9);
      if (mood === 'calm' || mood === 'happy') earTwitch(Math.random() < 0.5 ? P.earL : P.earR, 0.5);
    }
    if (!interacted && now > attractT && attractN < LINES.attract.length) {
      attractT = now + 6.5;
      fx.say(LINES.attract[attractN++], 2200);
      earTwitch(P.earL, 0.6);
    }
  }

  let running = false, last = 0, raf = 0;
  function tick() {
    const now = nowS();
    const dt = Math.min(0.05, last ? now - last : 0.016);
    last = now;
    step(now, dt);
    rig.render(now);
  }
  function rafLoop() { tick(); raf = requestAnimationFrame(rafLoop); }
  function start() {
    if (running) return;
    running = true; last = 0;
    if (G) G.ticker.add(tick); else rafLoop();
  }
  function stop() {
    if (!running) return;
    running = false;
    if (G) G.ticker.remove(tick); else cancelAnimationFrame(raf);
  }

  setMood('calm', nowS());
  rig.render(nowS());

  let greeted = false, leftAt = 0, backs = 0;
  function greet(now: number) {
    attractT = now + 5;
    if (past.visits && past.slaps > past.pets + past.hugs) {
      brain.set('skeptical', 3.2, now); fx.say("Oh… it's you. Gentle this time?", 3000);
    } else if (past.visits && past.pets + past.hugs > 0) {
      hop(); brain.set('happy', 2, now); fx.say("You're back! I missed you.", 2400);
    } else if (past.visits) {
      fx.say('Hi again! Pet me?', 2200);
    } else {
      fx.say("Hi! I'm Nimo. Pet me?", 2400);
    }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((x) => {
        const now = nowS();
        if (x.isIntersecting) {
          start();
          brain.idle = 0;
          if (!greeted) { greeted = true; window.setTimeout(() => greet(nowS()), 500); }
          else if (interacted && leftAt && now - leftAt > 8 && backs < 2) {
            backs++;
            brain.set('sad', 2.2, now); fx.say(pick(LINES.back), 2000);
            window.setTimeout(() => { hop(); fx.say("Yay, you're back!", 1600); }, 2300);
          }
        } else {
          leftAt = now;
          stop();
        }
      });
    }, { threshold: 0.1 }).observe(stage);
  } else start();
}
