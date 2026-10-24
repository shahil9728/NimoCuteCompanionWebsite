import './styles/main.css';
import { track } from './lib/analytics';
import { initWaitlistForms, EMAIL } from './lib/waitlistForms';
import { initWaitlistCount } from './lib/count';
import { initExploreMenu } from './lib/navMenu';
import { initInsights } from './lib/insights';
import { initSurvey } from './lib/survey';
import { initExitPrompt } from './lib/exitPrompt';
import { sendFeedback } from './lib/feedback';

(window as any).nimoTrack = track;

/* =========================================================
   NIMO — interactions (all feature-guarded; content is
   visible by default so the page works even if libs fail)
   ========================================================= */
(function(){
  "use strict";
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TOUCH  = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var hasGSAP = !!window.gsap;

  /* analytics + waitlist come from ES modules (src/lib) */

  /* ---------- Lenis smooth scroll (mouse/trackpad only; phones keep native scroll) ---------- */
  var lenis=null;
  if (window.Lenis && !REDUCE && !TOUCH){
    lenis = new Lenis({ duration:1.1, smoothWheel:true, lerp:0.09 });
    if (hasGSAP){ gsap.ticker.add(function(t){ lenis.raf(t*1000); }); gsap.ticker.lagSmoothing(0); }
    else { var raf=function(t){ lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  function lockScroll(){ document.body.style.overflow='hidden'; if(lenis){try{lenis.stop();}catch(_){}} }
  function unlockScroll(){ document.body.style.overflow=''; if(lenis){try{lenis.start();}catch(_){}} }
  // anchor smooth-scroll (works with or without Lenis)
  function scrollToEl(el){
    if(!el) return;
    if(lenis){ lenis.scrollTo(el, {offset:-70}); }
    else { el.scrollIntoView({behavior:REDUCE?'auto':'smooth', block:'start'}); }
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
      if(lenis){ lenis.scrollTo(0); } else { window.scrollTo({top:0, behavior:REDUCE?'auto':'smooth'}); }
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

  /* ---------- Reveal on scroll ----------
     IntersectionObserver + Web Animations instead of ScrollTrigger: no layout reads per element.
     The hero animates in pure CSS (main.css), so the headline never waits for JS. */
  var revealEls=[].slice.call(document.querySelectorAll('[data-anim]')).filter(function(el){ return !el.closest('.hero'); });
  if (!REDUCE && 'IntersectionObserver' in window && Element.prototype.animate){
    var rio=new IntersectionObserver(function(en){
      en.forEach(function(x){
        if(!x.isIntersecting) return;
        rio.unobserve(x.target);
        x.target.classList.remove('reveal-wait');
        x.target.animate([{opacity:0,translate:'0 26px'},{opacity:1,translate:'0 0'}],{duration:900,easing:'cubic-bezier(.22,.61,.36,1)'});
      });
    },{rootMargin:'0px 0px -12% 0px'});
    revealEls.forEach(function(el){ el.classList.add('reveal-wait'); rio.observe(el); });
  } // else: everything already visible (CSS default)

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

  /* ---------- Magnetic buttons + cursor ---------- */
  if(!TOUCH && !REDUCE){
    var spot=document.getElementById('spotlight'), dot=document.getElementById('cursorDot');
    var mx=window.innerWidth/2,my=window.innerHeight/2,sx=mx,sy=my;
    window.addEventListener('mousemove',function(e){ mx=e.clientX; my=e.clientY;
      dot.style.setProperty('--cursor-x', mx+'px'); dot.style.setProperty('--cursor-y', my+'px'); });
    // Hide the dot when the pointer leaves the window, so it can't sit stranded on screen.
    document.addEventListener('mouseleave',function(){ dot.style.opacity='0'; spot.style.opacity='0'; });
    document.addEventListener('mouseenter',function(){spot.style.opacity='1'; dot.style.opacity='1';});
    (function loop(){ sx+=(mx-sx)*.12; sy+=(my-sy)*.12; spot.style.transform='translate('+sx+'px,'+sy+'px)'; requestAnimationFrame(loop); })();
    document.querySelectorAll('.magnetic').forEach(function(el){
      el.addEventListener('mousemove',function(e){ var r=el.getBoundingClientRect(); var x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2; el.style.transform='translate('+x*.3+'px,'+y*.4+'px)'; });
      el.addEventListener('mouseleave',function(){ el.style.transform=''; });
    });
    // Set the scale, never append it — appending compounded on every hover
    // (2.4x, 5.8x, 13.8x ...) and eventually covered the whole viewport.
    document.querySelectorAll('a,button,input,summary,.emo-chip,.cw-chip').forEach(function(el){
      el.addEventListener('mouseenter',function(){ dot.style.setProperty('--cursor-scale','2.4'); dot.style.opacity='.5'; });
      el.addEventListener('mouseleave',function(){ dot.style.setProperty('--cursor-scale','1'); dot.style.opacity='1'; });
    });
  }

  /* ---------- Hero background parallax ---------- */
  var heroBg=document.querySelector('.hero-bg'), heroSec=document.querySelector('.hero');
  if(heroBg && heroSec && !TOUCH && !REDUCE){
    heroSec.addEventListener('mousemove',function(e){
      var r=heroSec.getBoundingClientRect(); var px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
      heroBg.style.transform='scale(1.06) translate('+(px*-14)+'px,'+(py*-10)+'px)';
    });
    heroSec.addEventListener('mouseleave',function(){ heroBg.style.transform='scale(1.06)'; });
  }

  /* ---------- Card tilt (data-tilt) ---------- */
  if(!TOUCH && !REDUCE){
    document.querySelectorAll('[data-tilt]').forEach(function(c){
      c.addEventListener('mousemove',function(e){ var r=c.getBoundingClientRect(); var px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
        c.style.transform='translateY(-6px) perspective(700px) rotateY('+(px*6)+'deg) rotateX('+(-py*6)+'deg)'; });
      c.addEventListener('mouseleave',function(){ c.style.transform=''; });
    });
  }

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

  /* ---------- Emotions: playground Nimo (src/nimo), fetched only when the section gets close ---------- */
  (function(){
    var sec=document.getElementById('emotions'); if(!sec) return;
    var load=function(){ import('./nimo/playground').then(function(m){ m.mountPlayground({ reduce: REDUCE, touch: TOUCH }); }); };
    if(!('IntersectionObserver' in window)){ load(); return; }
    var io=new IntersectionObserver(function(en){
      if(en.some(function(x){ return x.isIntersecting; })){ io.disconnect(); load(); }
    },{rootMargin:'600px 0px'});
    io.observe(sec);
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

  /* ---------- Ambient particle canvas ---------- */
  (function(){
    if(REDUCE || TOUCH) return; // phones: skip the full-screen canvas redraw every frame
    var cv=document.getElementById('particles'); if(!cv) return;
    var ctx=cv.getContext('2d'), W,H,DPR=Math.min(window.devicePixelRatio||1,2), pts=[], N=0, mouse={x:-999,y:-999};
    function resize(){ W=cv.width=innerWidth*DPR; H=cv.height=innerHeight*DPR; cv.style.width=innerWidth+'px'; cv.style.height=innerHeight+'px';
      N=Math.min(90, Math.round(innerWidth/16)); pts=[];
      for(var i=0;i<N;i++){ pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.18*DPR,vy:(Math.random()-.5)*.18*DPR,r:(Math.random()*1.6+.4)*DPR}); }
    }
    resize(); addEventListener('resize',resize);
    addEventListener('mousemove',function(e){ mouse.x=e.clientX*DPR; mouse.y=e.clientY*DPR; });
    var running=true; document.addEventListener('visibilitychange',function(){ running=!document.hidden; if(running) draw(); });
    function draw(){
      if(!running) return;
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<N;i++){ var p=pts[i]; p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.28); ctx.fillStyle='rgba(120,210,255,.5)'; ctx.fill();
        // link near mouse
        var dxm=p.x-mouse.x, dym=p.y-mouse.y, dm=dxm*dxm+dym*dym;
        if(dm< (150*DPR)*(150*DPR)){ ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(mouse.x,mouse.y);
          ctx.strokeStyle='rgba(53,224,255,'+(.16*(1-dm/((150*DPR)*(150*DPR))))+')'; ctx.lineWidth=DPR*.6; ctx.stroke(); }
        for(var j=i+1;j<N;j++){ var q=pts[j], dx=p.x-q.x, dy=p.y-q.y, d=dx*dx+dy*dy;
          if(d<(120*DPR)*(120*DPR)){ ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
            ctx.strokeStyle='rgba(90,150,255,'+(.09*(1-d/((120*DPR)*(120*DPR))))+')'; ctx.lineWidth=DPR*.5; ctx.stroke(); } }
      }
      requestAnimationFrame(draw);
    }
    draw();
  })();

  /* ---------- FAQ: single-open + track ---------- */
  var qas=[].slice.call(document.querySelectorAll('.faq details'));
  // The first FAQ starts open and may fire one toggle on load; only count opens a visitor caused.
  qas.forEach(function(d){ var skip=d.open; d.addEventListener('toggle',function(){ if(d.open){ qas.forEach(function(o){ if(o!==d) o.open=false; }); if(!skip) track.faqOpen(d.querySelector('summary').textContent); } skip=false; }); });


  /* ---------- Header logo eyes follow the cursor (keep blinking) ---------- */
  (function(){
    var eyes=[].slice.call(document.querySelectorAll('#nav .brand .mark i'));
    var mark=document.querySelector('#nav .brand .mark');
    if(!eyes.length || !mark || TOUCH || REDUCE) return;
    eyes.forEach(function(el){ el.style.animation='none'; });
    var tx=0,ty=0,cx=0,cy=0,blink=1;
    window.addEventListener('mousemove',function(ev){
      var r=mark.getBoundingClientRect(); var mx=r.left+r.width/2, my=r.top+r.height/2;
      var dx=ev.clientX-mx, dy=ev.clientY-my, mag=Math.max(1,Math.sqrt(dx*dx+dy*dy));
      tx=dx/mag*2.3; ty=dy/mag*1.8;
    });
    (function loop(){ cx+=(tx-cx)*.15; cy+=(ty-cy)*.15;
      for(var i=0;i<eyes.length;i++){ eyes[i].style.transform='translate('+cx.toFixed(2)+'px,'+cy.toFixed(2)+'px) scaleY('+blink+')'; }
      requestAnimationFrame(loop);
    })();
    setInterval(function(){ blink=.12; setTimeout(function(){ blink=1; },130); }, 4600);
  })();

  /* ---------- "Watch the film" modal ---------- */
  (function(){
    var modal=document.getElementById('demoModal'); if(!modal) return;
    var closeBtn=document.getElementById('demoClose'); var lastFocus=null;
    function openModal(){ lastFocus=document.activeElement; modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; if(lenis){try{lenis.stop();}catch(_){}} setTimeout(function(){ if(closeBtn) closeBtn.focus(); },60); }
    function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; if(lenis){try{lenis.start();}catch(_){}} if(lastFocus && lastFocus.focus) lastFocus.focus(); }
    document.querySelectorAll('[data-cta="watch-film"]').forEach(function(b){ b.addEventListener('click', function(e){
      e.preventDefault();
      var where=b.closest('.hero')?'hero':(b.closest('section[id]')||{id:'page'}).id;
      track.watchFilmClick(where);
      openModal();
    }); });
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && modal.classList.contains('open')) closeModal(); });
    modal.querySelectorAll('[data-join]').forEach(function(b){ b.addEventListener('click', function(){ closeModal(); }); });
  })();


  /* ---------- Feedback -> sent directly (Web3Forms email + Supabase backup, src/lib/feedback.ts) ---------- */
  (function(){
    var openBtn=document.getElementById('fbOpen'), modal=document.getElementById('fbModal'), closeBtn=document.getElementById('fbClose');
    if(!openBtn || !modal) return;
    var sendBtn=document.getElementById('fbSend'), msg=document.getElementById('fbMessage'), em=document.getElementById('fbEmail'), note=document.getElementById('fbNote');
    var lastFocus=null;
    function openFb(){ lastFocus=document.activeElement; modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; if(lenis){try{lenis.stop();}catch(_){}} setTimeout(function(){ if(msg) msg.focus(); },60); }
    function closeFb(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; if(lenis){try{lenis.start();}catch(_){}} if(lastFocus && lastFocus.focus) lastFocus.focus(); }
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
