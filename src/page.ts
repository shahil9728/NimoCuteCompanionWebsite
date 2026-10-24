import './styles/main.css';
import './styles/page.css';
import { track } from './lib/analytics';
import { initWaitlistForms } from './lib/waitlistForms';
import { initWaitlistCount } from './lib/count';
import { initSurvey } from './lib/survey';
import { initExitPrompt } from './lib/exitPrompt';
import { initExploreMenu } from './lib/navMenu';
import { initInsights } from './lib/insights';

/* =========================================================
   Content pages (guides + comparisons). Deliberately light:
   no GSAP, Lenis, particles or playground — just the nav,
   the waitlist forms, the sticky bar and the dialogs.
   ========================================================= */
(function(){
  "use strict";
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TOUCH  = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var PAGE = document.body.getAttribute('data-page') || 'page';

  function lockScroll(){ document.body.style.overflow='hidden'; }
  function unlockScroll(){ document.body.style.overflow=''; }
  function scrollToEl(el){ if(el) el.scrollIntoView({behavior:REDUCE?'auto':'smooth', block:'start'}); }

  /* ---------- Nav: scrolled state, mobile menu, current page ---------- */
  var nav=document.getElementById('nav');
  var onScrollNav=function(){ nav.classList.toggle('scrolled', window.scrollY>24); };
  onScrollNav(); window.addEventListener('scroll', onScrollNav, {passive:true});
  var burger=document.getElementById('burger'), menu=document.getElementById('mobileMenu');
  function closeMenu(){ if(menu){menu.classList.remove('open'); burger.setAttribute('aria-expanded','false');} }
  if(burger){ burger.addEventListener('click', function(){
    var open=menu.classList.toggle('open'); burger.setAttribute('aria-expanded', open?'true':'false');
  });}
  initExploreMenu();
  var here='/'+PAGE;
  document.querySelectorAll('#nav a[href="'+here+'"]').forEach(function(a){ a.setAttribute('aria-current','page'); });
  document.querySelectorAll('.nav-drop').forEach(function(d){ if(d.querySelector('a[href="'+here+'"]')) d.querySelector('.nav-drop-btn').classList.add('current'); });
  // "Keep reading" lists every guide; drop the one we're on.
  document.querySelectorAll('.guides a[href="'+here+'"]').forEach(function(a){ a.remove(); });

  /* ---------- Waitlist forms ---------- */
  // The sticky bar is shared markup; tag its signups with this page.
  var stickyForm=document.querySelector('#stickybar .waitlist-form');
  if(stickyForm) stickyForm.setAttribute('data-loc', PAGE+'-sticky');
  initWaitlistForms(function(loc){ if(/-sticky$/.test(loc)){ setTimeout(hideSticky,1600); } });

  (function(){
    var go=function(){ setTimeout(initWaitlistCount, 2500); };
    if(document.readyState==='complete') go(); else window.addEventListener('load', go, {once:true});
  })();

  initSurvey({ lock: lockScroll, unlock: unlockScroll });
  initExitPrompt({ touch: TOUCH, lock: lockScroll, unlock: unlockScroll });

  /* ---------- Join buttons -> hero form if it's on screen, else the closing form ---------- */
  document.querySelectorAll('[data-join]').forEach(function(b){
    b.addEventListener('click', function(){
      track.waitlistClick(PAGE+'-nav');
      closeMenu();
      var heroInput=document.querySelector('.page-hero input[type=email]') as HTMLInputElement;
      var r=heroInput?heroInput.getBoundingClientRect():null;
      if(r && r.top>60 && r.bottom<window.innerHeight && heroInput.offsetParent){ heroInput.focus(); return; }
      scrollToEl(document.getElementById('waitlist'));
      setTimeout(function(){ var i=document.querySelector('#waitlist input[type=email]') as HTMLInputElement; if(i) i.focus({preventScroll:true}); },600);
    });
  });
  document.querySelectorAll('[data-cta]').forEach(function(b){
    b.addEventListener('click',function(){ track.ctaClick(b.getAttribute('data-cta')); });
  });

  /* ---------- Sticky waitlist bar: after the hero, hidden while the closing form shows ---------- */
  var sticky=document.getElementById('stickybar');
  var dismissed=false;
  try{ dismissed=sessionStorage.getItem('nimo_sticky_closed')==='1'; }catch(_){}
  var stickyTracked=false;
  function showSticky(){ if(dismissed) return; sticky.classList.add('show'); if(!stickyTracked){ stickyTracked=true; track.stickyBar('shown'); } }
  function hideSticky(){ sticky.classList.remove('show'); }
  document.getElementById('stickyClose').addEventListener('click', function(){
    dismissed=true; hideSticky(); track.stickyBar('dismiss'); try{sessionStorage.setItem('nimo_sticky_closed','1');}catch(_){}
  });
  var hero=document.querySelector('.page-hero'), climax=document.getElementById('waitlist');
  if(hero && climax && 'IntersectionObserver' in window){
    var pastHero=false, climaxOn=false;
    var sync=function(){ if(pastHero && !climaxOn) showSticky(); else hideSticky(); };
    new IntersectionObserver(function(en){ en.forEach(function(x){ pastHero=!x.isIntersecting && x.boundingClientRect.top<0; }); sync(); }).observe(hero);
    new IntersectionObserver(function(en){ en.forEach(function(x){ climaxOn=x.isIntersecting; }); sync(); },{threshold:.2}).observe(climax);
  }

  /* ---------- Scroll depth tracking ---------- */
  var depths=[25,50,75,100], fired={};
  window.addEventListener('scroll', function(){
    var h=document.documentElement, sc=(h.scrollTop||document.body.scrollTop);
    var max=(h.scrollHeight-h.clientHeight)||1; var pct=Math.round(sc/max*100);
    depths.forEach(function(d){ if(pct>=d && !fired[d]){ fired[d]=true; track.scrollDepth(d); } });
  }, {passive:true});

  /* ---------- FAQ: single-open + track ---------- */
  var qas=[].slice.call(document.querySelectorAll('.faq details'));
  // The first FAQ starts open and may fire one toggle on load; only count opens a visitor caused.
  qas.forEach(function(d){ var skip=d.open; d.addEventListener('toggle',function(){ if(d.open){ qas.forEach(function(o){ if(o!==d) o.open=false; }); if(!skip) track.faqOpen(d.querySelector('summary').textContent); } skip=false; }); });

  /* ---------- GA4: section views, link clicks, menu opens (src/lib/insights.ts) ---------- */
  initInsights();
})();
