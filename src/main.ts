import './styles/main.css';
import { track } from './lib/analytics';
import { joinWaitlist } from './lib/supabase';

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

  /* ---------- Lenis smooth scroll + GSAP sync ---------- */
  var lenis=null;
  if (window.Lenis && !REDUCE){
    lenis = new Lenis({ duration:1.1, smoothWheel:true, lerp:0.09 });
    function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (hasGSAP && window.ScrollTrigger){
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(t){ lenis.raf(t*1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }
  // anchor smooth-scroll (works with or without Lenis)
  function scrollToEl(el){
    if(!el) return;
    if(lenis){ lenis.scrollTo(el, {offset:-70}); }
    else { el.scrollIntoView({behavior:REDUCE?'auto':'smooth', block:'start'}); }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id=a.getAttribute('href'); if(id.length<2) return;
      var el=document.querySelector(id); if(el){ e.preventDefault(); scrollToEl(el); closeMenu(); }
    });
  });

  /* ---------- Nav scrolled state + mobile menu ---------- */
  var nav=document.getElementById('nav');
  var onScrollNav=function(){ nav.classList.toggle('scrolled', window.scrollY>24); };
  onScrollNav(); window.addEventListener('scroll', onScrollNav, {passive:true});
  var burger=document.getElementById('burger'), menu=document.getElementById('mobileMenu');
  function closeMenu(){ if(menu){menu.classList.remove('open'); burger.setAttribute('aria-expanded','false');} }
  if(burger){ burger.addEventListener('click', function(){
    var open=menu.classList.toggle('open'); burger.setAttribute('aria-expanded', open?'true':'false');
  });}

  /* ---------- Reveal on scroll ---------- */
  var revealEls=[].slice.call(document.querySelectorAll('[data-anim]'));
  if (hasGSAP && window.ScrollTrigger && !REDUCE){
    gsap.registerPlugin(ScrollTrigger);
    revealEls.forEach(function(el){
      gsap.fromTo(el,{y:26,opacity:0},{y:0,opacity:1,duration:.9,ease:'power3.out',
        scrollTrigger:{trigger:el, start:'top 88%', once:true}});
    });
    // hero load-in stagger
    var heroAnim=[].slice.call(document.querySelectorAll('.hero-copy [data-anim], .hero-visual'));
    gsap.set(heroAnim,{opacity:0,y:30});
    gsap.to(heroAnim,{opacity:1,y:0,duration:1,ease:'power3.out',stagger:.1,delay:.15});
  } // else: everything already visible (CSS default)

    /* ---------- Waitlist forms (frictionless, Supabase-backed) ---------- */
  var EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  document.querySelectorAll('.waitlist-form').forEach(function(form){
    var loc=form.getAttribute('data-loc')||'unknown';
    var input=form.querySelector('input[type=email]');
    var btn=form.querySelector('button[type=submit]');
    var lblEl=btn?btn.querySelector('.lbl'):null;
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var val=(input.value||'').trim();
      track.waitlistClick(loc);
      if(!EMAIL.test(val)){
        input.style.borderColor='rgba(255,120,120,.7)'; input.focus();
        input.addEventListener('input',function(){input.style.borderColor='';},{once:true});
        return;
      }
      var original = lblEl?lblEl.innerHTML:(btn?btn.innerHTML:'');
      if(btn){ btn.disabled=true; btn.style.opacity='.75'; if(lblEl){lblEl.textContent='Joining…';} else {btn.textContent='Joining…';} }
      var res;
      try { res = await joinWaitlist(val, loc); } catch(err){ res={ok:false,error:String(err)}; }
      var success=null, sib=form.nextElementSibling;
      if(sib && sib.hasAttribute('data-success')) success=sib;
      if(res && res.ok){
        track.formSubmit(loc);
        if(success){
          success.innerHTML = res.already
            ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#59e6a0" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> You're already on the list — see you on the road!`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#59e6a0" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> You're on the list! We'll email <b style="color:#fff">${val.replace(/</g,'&lt;')}</b> the moment pre-orders open.`;
          success.classList.add('show'); form.style.display='none';
        } else {
          form.innerHTML = `<div class="form-success show" style="display:flex">🎉 You're on the list! We'll be in touch soon.</div>`;
        }
        if(loc==='sticky'){ setTimeout(hideSticky,1600); }
      } else {
        if(btn){ btn.disabled=false; btn.style.opacity=''; if(lblEl){lblEl.innerHTML=original;} else {btn.innerHTML=original;} }
        input.style.borderColor='rgba(255,120,120,.7)';
        if(success){ success.style.background='rgba(255,90,90,.1)'; success.style.borderColor='rgba(255,90,90,.35)'; success.style.color='#ffd7d7'; success.textContent='Hmm, that did not go through. Please try again.'; success.classList.add('show'); }
        console.error('[Nimo] waitlist error:', res && res.error);
      }
    });
  });

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
  function showSticky(){ if(!dismissed) sticky.classList.add('show'); }
  function hideSticky(){ sticky.classList.remove('show'); }
  document.getElementById('stickyClose').addEventListener('click', function(){
    dismissed=true; hideSticky(); try{sessionStorage.setItem('nimo_sticky_closed','1');}catch(_){}
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
    window.addEventListener('mousemove',function(e){ mx=e.clientX; my=e.clientY; dot.style.transform='translate('+mx+'px,'+my+'px)'; });
    document.addEventListener('mouseenter',function(){spot.style.opacity='1';});
    (function loop(){ sx+=(mx-sx)*.12; sy+=(my-sy)*.12; spot.style.transform='translate('+sx+'px,'+sy+'px)'; requestAnimationFrame(loop); })();
    document.querySelectorAll('.magnetic').forEach(function(el){
      el.addEventListener('mousemove',function(e){ var r=el.getBoundingClientRect(); var x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2; el.style.transform='translate('+x*.3+'px,'+y*.4+'px)'; });
      el.addEventListener('mouseleave',function(){ el.style.transform=''; });
    });
    document.querySelectorAll('a,button,input,summary,.emo-chip,.cw-chip').forEach(function(el){
      el.addEventListener('mouseenter',function(){ dot.style.transform+=' scale(2.4)'; dot.style.opacity='.5'; });
      el.addEventListener('mouseleave',function(){ dot.style.opacity='1'; });
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

  /* ---------- Emotions: interactive face ---------- */
  var face=document.getElementById('nimoFace'), eyes=document.getElementById('eyes'), glow=document.getElementById('faceGlow'), stage=document.getElementById('faceStage');
  var emoTitle=document.getElementById('emoTitle'), emoText=document.getElementById('emoText');
  var EMO={
    happy:{cls:'emo-happy',title:'Happy',text:'When you pet him or finish a task.',glow:'rgba(53,224,255,.45)'},
    sleepy:{cls:'emo-sleepy',title:'Sleepy',text:'At night or when his battery is low.',glow:'rgba(111,214,234,.32)'},
    angry:{cls:'emo-angry',title:'Grumpy',text:'If you brake too hard or shake him!',glow:'rgba(255,138,92,.4)'},
    lonely:{cls:'emo-lonely',title:'Lonely',text:'When you\'ve been away too long.',glow:'rgba(108,200,255,.4)'}
  };
  var chips=[].slice.call(document.querySelectorAll('.emo-chip')), order=['happy','sleepy','angry','lonely'], cur=0, autoTimer=null;
  function setEmo(key){
    var e=EMO[key]; if(!e||!face) return;
    face.className='nimo-face '+e.cls;
    if(glow) glow.style.background='radial-gradient(circle,'+e.glow+',transparent 65%)';
    if(emoTitle) emoTitle.textContent=e.title; if(emoText) emoText.textContent=e.text;
    chips.forEach(function(c){ c.setAttribute('aria-pressed', c.getAttribute('data-emo')===key?'true':'false'); });
    cur=order.indexOf(key);
  }
  chips.forEach(function(c){
    c.addEventListener('click',function(){ setEmo(c.getAttribute('data-emo')); stopAuto(); });
    c.addEventListener('mouseenter',function(){ setEmo(c.getAttribute('data-emo')); });
  });
  function startAuto(){ if(REDUCE) return; stopAuto(); autoTimer=setInterval(function(){ cur=(cur+1)%order.length; setEmo(order[cur]); },3400); }
  function stopAuto(){ if(autoTimer){clearInterval(autoTimer); autoTimer=null;} }
  // eyes track cursor
  if(eyes && !TOUCH && !REDUCE){
    window.addEventListener('mousemove',function(e){
      var r=stage.getBoundingClientRect(); var cx=r.left+r.width/2, cy=r.top+r.height/2;
      var dx=Math.max(-1,Math.min(1,(e.clientX-cx)/(r.width/2))), dy=Math.max(-1,Math.min(1,(e.clientY-cy)/(r.height/2)));
      eyes.style.transform='translateY(-50%) translate('+(dx*7)+'%,'+(dy*7)+'%)';
    });
  }
  // idle blink
  if(face && !REDUCE){
    setInterval(function(){ face.classList.add('blink'); setTimeout(function(){face.classList.remove('blink');},150); }, 4200);
  }
  // auto-cycle only while section in view
  if(stage && 'IntersectionObserver' in window){
    new IntersectionObserver(function(en){ en.forEach(function(x){ x.isIntersecting?startAuto():stopAuto(); }); },{threshold:.35}).observe(stage);
    var esec=document.getElementById('emotions');
    esec.addEventListener('mouseenter',stopAuto); esec.addEventListener('mouseleave',startAuto);
  }
  setEmo('happy');

  /* ---------- Colorways ---------- */
  var cwBody=document.getElementById('cwBody'), cwBase=document.getElementById('cwBase');
  document.querySelectorAll('.cw-chip').forEach(function(c){
    c.addEventListener('click',function(){
      var col=c.getAttribute('data-cw');
      document.querySelectorAll('.cw-chip').forEach(function(x){x.setAttribute('aria-pressed','false');});
      c.setAttribute('aria-pressed','true');
      if(cwBody) cwBody.style.setProperty('--nimo',col);
      if(cwBase) cwBase.style.background=col;
      track.buttonClick('colorway:'+c.textContent.trim());
    });
  });

  /* ---------- Ambient particle canvas ---------- */
  (function(){
    if(REDUCE) return;
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
  qas.forEach(function(d){ d.addEventListener('toggle',function(){ if(d.open){ qas.forEach(function(o){ if(o!==d) o.open=false; }); track.buttonClick('faq:'+d.querySelector('summary').textContent.trim().slice(0,40)); } }); });

})();
