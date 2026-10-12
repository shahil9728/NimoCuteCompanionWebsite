import { saveFeedback } from './supabase';
import { postToWeb3Forms } from './notify';

// Feedback goes straight to the owner's inbox via Web3Forms (same key as the waitlist
// alerts) and is also stored in Supabase as a backup. Success = either one worked.
function emailOwner(message: string, email: string, page: string): Promise<boolean> {
  return postToWeb3Forms({
    subject: '💬 Nimo website feedback' + (email ? ' from ' + email : ''),
    from_name: 'Nimo Feedback',
    ...(email ? { email } : {}), // Web3Forms uses this as reply-to
    message:
      message + '\n\n—\n' +
      'Reply to: ' + (email || '(not given)') + '\n' +
      'Page: ' + page + '\n' +
      'Time: ' + new Date().toLocaleString(),
  });
}

export async function sendFeedback(message: string, email: string): Promise<boolean> {
  const page = location.pathname + location.hash;
  const [mailed, saved] = await Promise.all([emailOwner(message, email, page), saveFeedback(message, email, page)]);
  return mailed || saved;
}
