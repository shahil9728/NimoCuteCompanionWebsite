import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { notifyOwner } from './notify';

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

  // Save in Supabase (primary store).
  let dbOk = !client;              // if unconfigured, treat as ok (local-only)
  let already = false;
  let dbError: string | undefined;
  if (client) {
    const { error } = await client.from(TABLE).insert({ email, source });
    if (!error) {
      dbOk = true;
    } else {
      const code = (error as { code?: string }).code;
      if (code === '23505' || /duplicate|unique/i.test(error.message)) {
        dbOk = true; already = true;          // already subscribed
      } else {
        dbError = error.message;
        console.error('[Nimo] Supabase insert failed:', error.message);
      }
    }
  }

  // Email the owner about every submission (also a capture fallback if the DB write failed).
  const status: 'new' | 'already' | 'unsaved' = already ? 'already' : dbOk ? 'new' : 'unsaved';
  const emailed = await notifyOwner(email, { status, location: source });

  if (dbOk) return { ok: true, already };
  if (emailed) return { ok: true };           // DB failed but owner was emailed — no lead lost
  return { ok: false, error: dbError || 'Could not submit' };
}
