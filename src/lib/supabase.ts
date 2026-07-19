import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Waitlist persistence via Supabase.
 * Configure with env vars (see .env.example):
 *   VITE_SUPABASE_URL       (defaults to the Nimo project URL)
 *   VITE_SUPABASE_ANON_KEY  (required to actually write to the DB)
 *   VITE_WAITLIST_TABLE     (optional, default "waitlist")
 *
 * Until the anon key is set the site still works: emails are cached in
 * localStorage and the success state is shown. Once the key is present,
 * submissions are inserted into the `waitlist` table (see README for SQL).
 */
const url = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://ymzdchbgtkoiokgoqkdc.supabase.co';
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_wcreCwzQjd3XLcpTk28KbQ_dfFiiEPt';
const TABLE = (import.meta.env.VITE_WAITLIST_TABLE as string) || 'waitlist';

let client: SupabaseClient | null = null;
if (url && anon) {
  client = createClient(url, anon);
} else {
  console.warn('[Nimo] Supabase anon key not set — waitlist stores locally only. Set VITE_SUPABASE_ANON_KEY to persist.');
}

export interface WaitlistResult { ok: boolean; already?: boolean; error?: string }

export async function joinWaitlist(email: string, source = 'website'): Promise<WaitlistResult> {
  // Local safety-net copy (also used as the offline fallback).
  try {
    const list = JSON.parse(localStorage.getItem('nimo_waitlist') || '[]');
    list.push({ email, source, at: Date.now() });
    localStorage.setItem('nimo_waitlist', JSON.stringify(list));
  } catch { /* ignore */ }

  if (!client) return { ok: true }; // not configured yet — succeed gracefully

  const { error } = await client.from(TABLE).insert({ email, source });
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === '23505' || /duplicate|unique/i.test(error.message)) {
      return { ok: true, already: true }; // already subscribed
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
