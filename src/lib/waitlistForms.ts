import { track } from './analytics';
import { joinWaitlist } from './supabase';
import { bumpWaitlistCount } from './count';
import { hasJoined } from './joined';

const TICK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';

/* Every .waitlist-form on the page: validate, save (Supabase + owner email), swap in the
   success note that sits right after the form ([data-success]). Shared by the home page
   (main.ts) and the content pages (page.ts). `onJoined` runs after a successful join. */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initWaitlistForms(onJoined?: (loc: string) => void) {
  // Already joined in this browser: every form on every page says so instead of asking again,
  // and the sticky join bar stays away (.is-joined in main.css).
  if (hasJoined()) {
    document.documentElement.classList.add('is-joined');
    document.querySelectorAll<HTMLFormElement>('.waitlist-form').forEach(showJoined);
    return;
  }
  document.querySelectorAll('.waitlist-form').forEach(function(form: HTMLFormElement){
    var loc=form.getAttribute('data-loc')||'unknown';
    var input=form.querySelector('input[type=email]') as HTMLInputElement;
    var btn=form.querySelector('button[type=submit]') as HTMLButtonElement;
    var lblEl=btn?btn.querySelector('.lbl'):null;
    // First keystroke or autofill in the email box = someone started to join (funnel step
    // before submit). Focus and taps don't count: the exit prompt and the Join buttons focus
    // the box by code, and on phones a swipe that starts on the box fires pointerdown.
    // 'change' covers autofill paths that skip 'input'.
    var started=false;
    var start=function(){ if(started) return; started=true; track.formStart(loc); };
    ['input','change'].forEach(function(t){ input.addEventListener(t, start); });

    // A line under the box that says what went wrong; a red border alone left people guessing.
    var note:HTMLElement|null=null;
    var showError=function(text:string){
      if(!note){
        note=document.createElement('p');
        note.className='form-error';
        note.setAttribute('role','alert');
        if(input.id){ note.id=input.id+'-error'; input.setAttribute('aria-describedby', note.id); }
        form.appendChild(note);
      }
      note.textContent=text; note.hidden=false;
      input.classList.add('invalid'); input.setAttribute('aria-invalid','true');
    };
    var clearError=function(){
      if(note) note.hidden=true;
      input.classList.remove('invalid'); input.removeAttribute('aria-invalid');
    };
    input.addEventListener('input', clearError);
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var val=(input.value||'').trim();
      track.waitlistClick(loc);
      if(!EMAIL.test(val)){
        track.formError(loc, val ? 'invalid_email' : 'empty');
        showError(val ? "That email doesn't look right. Please check it." : 'Please add your email first.');
        input.focus();
        return;
      }
      clearError();
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
        document.documentElement.classList.add('is-joined');
        // every other form on the page now says "you're on the waitlist" too
        document.querySelectorAll<HTMLFormElement>('.waitlist-form').forEach(function(f){ if(f!==form) showJoined(f); });
        // survey + exit prompt listen for this
        document.dispatchEvent(new CustomEvent('nimo:joined',{detail:{email:val, loc:loc, already:!!res.already}}));
        if(success){
          success.innerHTML = res.already
            ? TICK + "<span>You're already on the list</span>"
            : TICK + "<span>You're on the list!</span>";
          success.classList.add('show'); form.style.display='none';
        } else {
          form.innerHTML = `<div class="form-success show" style="display:flex">🎉 You're on the list! We'll be in touch soon.</div>`;
        }
        if(onJoined) onJoined(loc);
      } else {
        if(btn){ btn.disabled=false; btn.style.opacity=''; if(lblEl){lblEl.innerHTML=original;} else {btn.innerHTML=original;} }
        // Shown on the form, not in the success box, so a later successful retry isn't painted red.
        showError('Hmm, that did not go through. Please try again.');
        track.formError(loc, 'submit_failed');
        console.error('[Nimo] waitlist error:', res && res.error);
      }
    });
  });
}

/* Swap a form for the "you're on the waitlist" note that sits right after it ([data-success]). */
function showJoined(form: HTMLFormElement) {
  var sib = form.nextElementSibling;
  if (!sib || !sib.hasAttribute('data-success') || sib.classList.contains('show')) return;
  sib.innerHTML = TICK + "<span>You're on the list</span>";
  sib.classList.add('show'); form.style.display = 'none';
}
