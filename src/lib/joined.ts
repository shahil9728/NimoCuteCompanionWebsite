// Has this browser already joined the waitlist? Every join since 2 Oct 2026 sets
// `nimo_joined`; earlier signups only left their email in `nimo_waitlist` (supabase.ts),
// so those count too, and get the flag written so the next check is a single read.
const JOINED_KEY = 'nimo_joined';

export function hasJoined(): boolean {
  try {
    if (localStorage.getItem(JOINED_KEY) === '1') return true;
    const list = JSON.parse(localStorage.getItem('nimo_waitlist') || '[]');
    if (Array.isArray(list) && list.length > 0) {
      localStorage.setItem(JOINED_KEY, '1');
      return true;
    }
  } catch (_) { /* private mode or bad JSON */ }
  return false;
}
