import './styles/main.css';
import { track } from './lib/analytics';
import { initWaitlistForms, EMAIL } from './lib/waitlistForms';
import { initWaitlistCount } from './lib/count';
import { initExploreMenu } from './lib/navMenu';
import { initInsights } from './lib/insights';
import { initSurvey } from './lib/survey';
import { initExitPrompt } from './lib/exitPrompt';
import { hasJoined } from './lib/joined';
import { sendFeedback } from './lib/feedback';
import { initReveal } from './lib/reveal';
import { loadGsap } from './lib/gsap';

(window as any).nimoTrack = track;

/* =========================================================
   NIMO — interactions (all feature-guarded; content is
   visible by default so the page works even if libs fail)
   ========================================================= */
(function(){
  "use strict";
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TOUCH  = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  /* analytics + waitlist come from ES modules (src/lib) */

  /* Native scrolling everywhere; sections carry scroll-margin-top for the fixed nav. */
  function lockScroll(){ document.body.style.overflow='hidden'; }
  function unlockScroll(){ document.body.style.overflow=''; }
  function scrollToEl(el){
    if(!el) return;
    el.scrollIntoView({behavior:REDUCE?'auto':'smooth', block:'start'});
  }
  // The shared nav/footer link to "/#about" etc. so they work from every page; here on the
  // home page those scroll in place instead of reloading. "/" (the logo) scrolls to the top.
  document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id=a.getAttribute('href').replace(/^\//,''); if(id.length<2) return;
      var el=document.querySelector(id); if(el){ e.preventDefault(); scrollToEl(el); closeMenu(); }
    });
  });
  document.querySelectorAll('a[href="/"]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault(); closeMenu();
      window.scrollTo({top:0, behavior:REDUCE?'auto':'smooth'});
    });
  });
  initExploreMenu();
  initInsights(); // GA4: section views, link clicks, menu opens

  /* ---------- Nav scrolled state + mobile menu ---------- */
  var nav=document.getElementById('nav');
  var onScrollNav=function(){ nav.classList.toggle('scrolled', window.scrollY>24); };
  onScrollNav(); window.addEventListener('scroll', onScrollNav, {passive:true});
  var burger=document.getElementById('burger'), menu=document.getElementById('mobileMenu');
  function closeMenu(){ if(menu){menu.classList.remove('open'); burger.setAttribute('aria-expanded','false');} }
  if(burger){ burger.addEventListener('click', function(){
    var open=menu.classList.toggle('open'); burger.setAttribute('aria-expanded', open?'true':'false');
  });}

  /* ---------- One fade-in for sections below the fold (the hero intro runs in CSS) ---------- */
  initReveal('[data-anim]', '.hero');

    /* ---------- Waitlist forms (frictionless, Supabase-backed, src/lib/waitlistForms.ts) ---------- */
  initWaitlistForms(function(loc){ if(loc==='sticky'){ setTimeout(hideSticky,1600); } });

  // Count fetch waits until after load so its new connection never competes with the first paint.
  (function(){
    var go=function(){ setTimeout(initWaitlistCount, 2500); };
    if(document.readyState==='complete') go(); else window.addEventListener('load', go, {once:true});
  })();

  initSurvey({ lock: lockScroll, unlock: unlockScroll });
  initExitPrompt({ touch: TOUCH, lock: lockScroll, unlock: unlockScroll });

/* ---------- Join buttons -> focus nearest waitlist ---------- */
  document.querySelectorAll('[data-join]').forEach(function(b){
    b.addEventListener('click', function(){
      track.waitlistClick('nav');
      var heroInput=document.getElementById('hero-email');
      var heroRect=heroInput?heroInput.getBoundingClientRect():null;
      if(heroRect && heroRect.top>60 && heroRect.bottom<window.innerHeight){ heroInput.focus(); }
      else { scrollToEl(document.getElementById('waitlist')); setTimeout(function(){var i=document.getElementById('climax-email'); if(i) i.focus();},700); }
    });
  });
  document.querySelectorAll('[data-cta]').forEach(function(b){
    b.addEventListener('click',function(){ track.ctaClick(b.getAttribute('data-cta')); });
  });

  /* ---------- Sticky waitlist bar ---------- */
  var sticky=document.getElementById('stickybar');
  var dismissed=false;
  try{ dismissed=sessionStorage.getItem('nimo_sticky_closed')==='1'; }catch(_){}
  var stickyTracked=false;
  function showSticky(){ if(!dismissed){ sticky.classList.add('show'); if(!stickyTracked){ stickyTracked=true; track.stickyBar('shown'); } } var _fb=document.getElementById('fbOpen'); if(_fb) _fb.classList.add('raised'); }
  function hideSticky(){ sticky.classList.remove('show'); var _fb=document.getElementById('fbOpen'); if(_fb) _fb.classList.remove('raised'); }
  document.getElementById('stickyClose').addEventListener('click', function(){
    dismissed=true; hideSticky(); track.stickyBar('dismiss'); try{sessionStorage.setItem('nimo_sticky_closed','1');}catch(_){}
  });
  var hero=document.querySelector('.hero'), climax=document.getElementById('waitlist');
  if('IntersectionObserver' in window){
    var heroSeen=false;
    new IntersectionObserver(function(en){
      en.forEach(function(x){ if(!x.isIntersecting && heroSeen){ showSticky(); } if(x.isIntersecting){heroSeen=true; hideSticky();} });
    },{rootMargin:'-40% 0px 0px 0px'}).observe(hero);
    // hide sticky when the climax waitlist is on screen (avoid duplicate CTAs)
    new IntersectionObserver(function(en){
      en.forEach(function(x){ if(x.isIntersecting) hideSticky(); else if(heroSeen && !dismissed && window.scrollY>window.innerHeight) showSticky(); });
    },{threshold:.2}).observe(climax);
  }

  /* ---------- Scroll depth tracking ---------- */
  var depths=[25,50,75,100], fired={};
  window.addEventListener('scroll', function(){
    var h=document.documentElement, sc=(h.scrollTop||document.body.scrollTop);
    var max=(h.scrollHeight-h.clientHeight)||1; var pct=Math.round(sc/max*100);
    depths.forEach(function(d){ if(pct>=d && !fired[d]){ fired[d]=true; track.scrollDepth(d); } });
  }, {passive:true});

  /* ---------- How-it-works step progress ---------- */
  var steps=[].slice.call(document.querySelectorAll('.step'));
  var prog=document.getElementById('howProgress');
  if(steps.length && 'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(en){
      en.forEach(function(x){ if(x.isIntersecting){
        steps.forEach(function(s){s.classList.remove('active');});
        x.target.classList.add('active');
        var i=+x.target.getAttribute('data-step'); if(prog) prog.style.width=((i+1)/steps.length*100)+'%';
      }});
    },{rootMargin:'-45% 0px -45% 0px'});
    steps.forEach(function(s){io.observe(s);});
    steps[0].classList.add('active');
  }

  /* ---------- Ride-along signals: sequential light-up ---------- */
  var signals=[].slice.call(document.querySelectorAll('#signals .signal'));
  if(signals.length && !REDUCE){
    var si=0;
    setInterval(function(){ signals.forEach(function(s){s.classList.remove('lit');}); signals[si].classList.add('lit'); si=(si+1)%signals.length; }, 1100);
  } else { signals.forEach(function(s){s.classList.add('lit');}); }

  /* ---------- Emotions: playground Nimo (src/nimo) ----------
     Its one-time setup costs a few hundred ms, so it runs while the page is idle after load
     rather than mid-scroll. Scrolling close before then still starts it straight away. */
  (function(){
    var sec=document.getElementById('emotions'); if(!sec) return;
    var started=false, io=null;
    // GSAP is fetched here, only for the playground, alongside its own chunk.
    var load=function(){
      if(started) return; started=true; if(io) io.disconnect();
      Promise.all([loadGsap(), import('./nimo/playground')]).then(function(r){ r[1].mountPlayground({ reduce: REDUCE, touch: TOUCH }); });
    };
    if(!('IntersectionObserver' in window)){ load(); return; }
    io=new IntersectionObserver(function(en){
      if(en.some(function(x){ return x.isIntersecting; })) load();
    },{rootMargin:'600px 0px'});
    io.observe(sec);
    var idle=function(){ if('requestIdleCallback' in window) requestIdleCallback(load,{timeout:3000}); else setTimeout(load,1500); };
    if(document.readyState==='complete') idle(); else window.addEventListener('load', idle, {once:true});
  })();

  /* ---------- Colorways ---------- */
  var cwBody=document.getElementById('cwBody'), cwBase=document.getElementById('cwBase');
  document.querySelectorAll('.cw-chip').forEach(function(c){
    c.addEventListener('click',function(){
      var col=c.getAttribute('data-cw');
      document.querySelectorAll('.cw-chip').forEach(function(x){x.setAttribute('aria-pressed','false');});
      c.setAttribute('aria-pressed','true');
      if(cwBody) cwBody.style.setProperty('--nimo',col);
      if(cwBase) cwBase.style.background=col;
      track.colorwaySelect(c.textContent.trim());
    });
  });

  /* ---------- FAQ: single-open + track ---------- */
  var qas=[].slice.call(document.querySelectorAll('.faq details'));
  // The first FAQ starts open and may fire one toggle on load; only count opens a visitor caused.
  qas.forEach(function(d){ var skip=d.open; d.addEventListener('toggle',function(){ if(d.open){ qas.forEach(function(o){ if(o!==d) o.open=false; }); if(!skip) track.faqOpen(d.querySelector('summary').textContent); } skip=false; }); });


  /* ---------- "Watch the film" modal: the film isn't out yet, so it takes the email right there ---------- */
  (function(){
    var modal=document.getElementById('demoModal'); if(!modal) return;
    var closeBtn=document.getElementById('demoClose'); var lastFocus=null;
    var form=modal.querySelector('.waitlist-form') as HTMLFormElement|null;
    var input=modal.querySelector('input[type=email]') as HTMLInputElement|null;
    var note=modal.querySelector('[data-success]') as HTMLElement|null;
    function openModal(){
      lastFocus=document.activeElement;
      // Already on the list: say so instead of asking for the email again.
      if(form && note && form.style.display!=='none' && hasJoined()){
        form.style.display='none';
        note.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#59e6a0" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg><span>You\'re already on the list, so you\'ll be among the first to see it.</span>';
        note.classList.add('show');
      }
      modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
      // Desktop: cursor straight into the email box. Phones: don't pop the keyboard up uninvited.
      setTimeout(function(){ var t=(!TOUCH && input && form && form.style.display!=='none') ? input : closeBtn; if(t) t.focus(); },60);
    }
    function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; if(lastFocus && lastFocus.focus) lastFocus.focus(); }
    document.querySelectorAll('[data-cta="watch-film"]').forEach(function(b){ b.addEventListener('click', function(e){
      e.preventDefault();
      var where=b.closest('.hero')?'hero':(b.closest('section[id]')||{id:'page'}).id;
      track.watchFilmClick(where);
      openModal();
    }); });
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && modal.classList.contains('open')) closeModal(); });
    // Joined from here: show the thank-you for a moment, then close (survey.ts opens after).
    document.addEventListener('nimo:joined', function(ev){
      var d=(ev as CustomEvent).detail||{};
      if(d.loc==='film') setTimeout(closeModal, d.already ? 2200 : 1200);
    });
  })();


  /* ---------- Feedback -> sent directly (Web3Forms email + Supabase backup, src/lib/feedback.ts) ---------- */
  (function(){
    var openBtn=document.getElementById('fbOpen'), modal=document.getElementById('fbModal'), closeBtn=document.getElementById('fbClose');
    if(!openBtn || !modal) return;
    var sendBtn=document.getElementById('fbSend'), msg=document.getElementById('fbMessage'), em=document.getElementById('fbEmail'), note=document.getElementById('fbNote');
    var lastFocus=null;
    function openFb(){ lastFocus=document.activeElement; modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; setTimeout(function(){ if(msg) msg.focus(); },60); }
    function closeFb(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; if(lastFocus && lastFocus.focus) lastFocus.focus(); }
    openBtn.addEventListener('click', openFb);
    if(closeBtn) closeBtn.addEventListener('click', closeFb);
    modal.addEventListener('click', function(e){ if(e.target===modal) closeFb(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && modal.classList.contains('open')) closeFb(); });
    var sending=false;
    function setNote(text, cls){ if(note){ note.textContent=text; note.className='fb-note'+(cls?' '+cls:''); } }
    if(sendBtn) sendBtn.addEventListener('click', async function(){
      if(sending) return;
      var m=((msg&&msg.value)||'').trim();
      if(!m){ setNote('Please write a short message first.'); if(msg) msg.focus(); return; }
      var mail=((em&&em.value)||'').trim();
      if(mail && !EMAIL.test(mail)){ setNote('That email looks off. Fix it or leave it empty.', 'err'); if(em) em.focus(); return; }
      sending=true; sendBtn.disabled=true; sendBtn.style.opacity='.75';
      var lbl=sendBtn.querySelector('.lbl'), original=lbl?lbl.textContent:'';
      if(lbl) lbl.textContent='Sending…';
      setNote('');
      var ok=false;
      try{ ok=await sendFeedback(m.slice(0,5000), mail); }catch(_){ ok=false; }
      sending=false; sendBtn.disabled=false; sendBtn.style.opacity=''; if(lbl) lbl.textContent=original;
      try{ track.buttonClick(ok?'feedback-sent':'feedback-failed'); }catch(_){}
      if(ok){
        setNote('Sent! Nimo got your message. Thank you 💜', 'ok');
        if(msg) msg.value='';
        setTimeout(function(){ closeFb(); setNote(''); }, 1800);
      } else {
        setNote("Couldn't send right now. Please try again in a moment.", 'err');
      }
    });
  })();

})();
