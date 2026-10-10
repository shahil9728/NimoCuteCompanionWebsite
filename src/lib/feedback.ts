import { saveFeedback } from './supabase';

// Feedback goes straight to the owner's inbox via Web3Forms (same key as the waitlist
// alerts) and is also stored in Supabase as a backup. Success = either one worked.
const KEY = (import.meta.env.VITE_WEB3FORMS_KEY as string) || 'd32dbfbf-0b8f-4a74-900f-99c9ba753ef9';

async function emailOwner(message: string, email: string, page: string): Promise<boolean> {
  if (!KEY) return false;
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: KEY,
        subject: '💬 Nimo website feedback' + (email ? ' from ' + email : ''),
        from_name: 'Nimo Feedback',
        ...(email ? { email } : {}), // Web3Forms uses this as reply-to
        message:
          message + '\n\n—\n' +
          'Reply to: ' + (email || '(not given)') + '\n' +
          'Page: ' + page + '\n' +
          'Time: ' + new Date().toLocaleString(),
      }),
    });
    const data = await res.json().catch(() => ({} as { success?: boolean }));
    return !!(data && data.success);
  } catch (err) {
    console.warn('[Nimo] feedback email failed:', err);
    return false;
  }
}

export async function sendFeedback(message: string, email: string): Promise<boolean> {
  const page = location.pathname + location.hash;
  const [mailed, saved] = await Promise.all([emailOwner(message, email, page), saveFeedback(message, email, page)]);
  return mailed || saved;
}
