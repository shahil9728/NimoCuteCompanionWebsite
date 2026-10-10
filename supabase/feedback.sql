-- Backup copy of messages sent from the website's Feedback button (src/lib/feedback.ts).
-- Run once in Supabase -> SQL Editor. Safe to re-run.
create extension if not exists "pgcrypto";

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  message    text not null check (char_length(message) between 1 and 5000),
  email      text check (char_length(email) <= 320),
  page       text check (char_length(page) <= 200),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Anonymous visitors may send feedback but cannot read anyone's.
drop policy if exists "anon can send feedback" on public.feedback;
create policy "anon can send feedback"
  on public.feedback
  for insert
  to anon
  with check (true);
