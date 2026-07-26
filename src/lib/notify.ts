// Emails the site owner when someone joins the waitlist — using Web3Forms,
// which works from a fully static site (no backend). Create a free access key
// at https://web3forms.com using the address you want alerts sent to
// (shahilverma91383@gmail.com), then set VITE_WEB3FORMS_KEY.
const KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;

type NotifyStatus = 'new' | 'already' | 'unsaved';

export async function notifyOwner(email: string, opts: { status: NotifyStatus; location: string }): Promise<boolean> {
  if (!KEY) return false; // not configured yet — skip silently
  const label =
    opts.status === 'new' ? '🎉 New Nimo waitlist signup'
    : opts.status === 'already' ? '🔁 Returning signup (already on the list)'
    : '⚠️ New signup (not saved to DB — check RLS)';
  const statusText =
    opts.status === 'new' ? 'New signup'
    : opts.status === 'already' ? 'Already on the list'
    : 'Not saved to Supabase (RLS) — captured via email';
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: KEY,
        subject: label + ': ' + email,
        from_name: 'Nimo Waitlist',
        email, // reply-to the person who signed up
        message:
          'New waitlist activity on Nimo.\n\n' +
          'Email: ' + email + '\n' +
          'Status: ' + statusText + '\n' +
          'Where: ' + opts.location + '\n' +
          'Time: ' + new Date().toLocaleString(),
      }),
    });
    const data = await res.json().catch(() => ({} as { success?: boolean }));
    return !!(data && data.success);
  } catch (err) {
    console.warn('[Nimo] owner email notification failed:', err);
    return false;
  }
}
