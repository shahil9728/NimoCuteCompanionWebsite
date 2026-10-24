import { track } from './analytics';
import { joinWaitlist } from './supabase';
import { bumpWaitlistCount } from './count';

/* Every .waitlist-form on the page: validate, save (Supabase + owner email), swap in the
   success note that sits right after the form ([data-success]). Shared by the home page
   (main.ts) and the content pages (page.ts). `onJoined` runs after a successful join. */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initWaitlistForms(onJoined?: (loc: string) => void) {
  document.querySelectorAll('.waitlist-form').forEach(function(form: HTMLFormElement){
    var loc=form.getAttribute('data-loc')||'unknown';
    var input=form.querySelector('input[type=email]') as HTMLInputElement;
    var btn=form.querySelector('button[type=submit]') as HTMLButtonElement;
    var lblEl=btn?btn.querySelector('.lbl'):null;
    // First tap, focus or keystroke in the email box = someone started to join (funnel step
    // before submit). Several triggers because focus alone is skipped by some autofill paths.
    var started=false;
    var start=function(){ if(started) return; started=true; track.formStart(loc); };
    ['pointerdown','focus','input'].forEach(function(t){ input.addEventListener(t, start); });
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var val=(input.value||'').trim();
      track.waitlistClick(loc);
      if(!EMAIL.test(val)){
        track.formError(loc, val ? 'invalid_email' : 'empty');
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
        track.markJoined();
        if(!res.already){ track.lead(loc); bumpWaitlistCount(); }
        try{ localStorage.setItem('nimo_joined','1'); }catch(_){}
        // survey + exit prompt listen for this
        document.dispatchEvent(new CustomEvent('nimo:joined',{detail:{email:val, loc:loc, already:!!res.already}}));
        if(success){
          success.innerHTML = res.already
            ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#59e6a0" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg><span>You're already on the list — see you on the road!</span>`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#59e6a0" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg><span>You're on the list! We'll email <b style="color:#fff">${val.replace(/</g,'&lt;')}</b> the moment pre-orders open.</span>`;
          success.classList.add('show'); form.style.display='none';
        } else {
          form.innerHTML = `<div class="form-success show" style="display:flex">🎉 You're on the list! We'll be in touch soon.</div>`;
        }
        if(onJoined) onJoined(loc);
      } else {
        if(btn){ btn.disabled=false; btn.style.opacity=''; if(lblEl){lblEl.innerHTML=original;} else {btn.innerHTML=original;} }
        input.style.borderColor='rgba(255,120,120,.7)';
        if(success){ success.style.background='rgba(255,90,90,.1)'; success.style.borderColor='rgba(255,90,90,.35)'; success.style.color='#ffd7d7'; success.textContent='Hmm, that did not go through. Please try again.'; success.classList.add('show'); }
        track.formError(loc, 'submit_failed');
        console.error('[Nimo] waitlist error:', res && res.error);
      }
    });
  });
}
