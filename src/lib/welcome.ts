/**
 * Sends the "you're on the list" welcome email to the person who just signed up.
 *
 * The email is delivered by a Google Apps Script web app running as
 * nimo.cutu@gmail.com (see apps-script/Code.gs), which is what lets it arrive
 * genuinely FROM that Gmail address — a third-party sender cannot pass SPF/DKIM
 * for gmail.com and would land in spam.
 *
 * Configure after deploying the script:
 *   VITE_WELCOME_ENDPOINT  the /exec URL of the Apps Script deployment
 *   VITE_WELCOME_TOKEN     same random string as SHARED_TOKEN in Code.gs
 *
 * Until VITE_WELCOME_ENDPOINT is set this is a no-op, so the waitlist keeps
 * working exactly as before.
 */
const ENDPOINT = (import.meta.env.VITE_WELCOME_ENDPOINT as string) || '';
const TOKEN = (import.meta.env.VITE_WELCOME_TOKEN as string) || '';

export async function sendWelcomeEmail(email: string): Promise<boolean> {
  if (!ENDPOINT) return false; // not configured yet — skip silently

  const body = JSON.stringify({ email, token: TOKEN });

  // text/plain keeps this a CORS "simple request", so the browser skips the
  // preflight that Apps Script does not answer. keepalive lets it finish even
  // if the visitor navigates away right after submitting.
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
    keepalive: true,
  };

  try {
    const res = await fetch(ENDPOINT, init);
    const data = await res.json().catch(() => null as { ok?: boolean } | null);
    if (data && data.ok) return true;
    if (data && !data.ok) {
      console.warn('[Nimo] welcome email refused:', data);
      return false;
    }
    return res.ok;
  } catch {
    // Apps Script redirects to googleusercontent.com, which some browsers treat
    // as an opaque CORS failure even though the request was delivered. Retry
    // fire-and-forget so the email still goes out; we just can't read the reply.
    try {
      await fetch(ENDPOINT, { ...init, mode: 'no-cors' });
      return true;
    } catch (err) {
      console.warn('[Nimo] welcome email failed:', err);
      return false;
    }
  }
}
