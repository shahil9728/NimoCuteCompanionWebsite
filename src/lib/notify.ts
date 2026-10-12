// Emails the site owner when someone joins the waitlist — using Web3Forms,
// which works from a fully static site (no backend). Create a free access key
// at https://web3forms.com using the address you want alerts sent to
// (shahilverma91383@gmail.com), then set VITE_WEB3FORMS_KEY.
const KEY = (import.meta.env.VITE_WEB3FORMS_KEY as string) || 'd32dbfbf-0b8f-4a74-900f-99c9ba753ef9';
const ENDPOINT = 'https://api.web3forms.com/submit';

type NotifyStatus = 'new' | 'already' | 'unsaved';

// One Web3Forms submission (also used by the feedback button). Extensions that rewrite
// CORS headers, like "Allow CORS" left switched on, make the JSON request fail its
// preflight, so it never leaves the browser. Then resend it as a plain form post in
// no-cors mode: there is no preflight, so it is delivered; we just cannot read the reply.
export async function postToWeb3Forms(fields: Record<string, string>): Promise<boolean> {
  if (!KEY) return false; // not configured yet — skip silently
  const body = { access_key: KEY, ...fields };
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({} as { success?: boolean }));
    return !!(data && data.success);
  } catch {
    try {
      await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(body) });
      return true;
    } catch (err) {
      console.warn('[Nimo] Web3Forms submission failed:', err);
      return false;
    }
  }
}

export async function notifyOwner(email: string, opts: { status: NotifyStatus; location: string }): Promise<boolean> {
  const label =
    opts.status === 'new' ? '🎉 New Nimo waitlist signup'
    : opts.status === 'already' ? '🔁 Returning signup (already on the list)'
    : '⚠️ New signup (not saved to DB)';
  const statusText =
    opts.status === 'new' ? 'New signup'
    : opts.status === 'already' ? 'Already on the list'
    : 'Not saved to Supabase (RLS, or a browser extension blocked the request) — captured via email';
  return postToWeb3Forms({
    subject: label + ': ' + email,
    from_name: 'Nimo Waitlist',
    email, // reply-to the person who signed up
    message:
      'New waitlist activity on Nimo.\n\n' +
      'Email: ' + email + '\n' +
      'Status: ' + statusText + '\n' +
      'Where: ' + opts.location + '\n' +
      'Time: ' + new Date().toLocaleString(),
  });
}
