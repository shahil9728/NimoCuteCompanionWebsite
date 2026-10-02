-- Answers to the 4 quick questions shown after signup (src/lib/survey.ts).
-- Run once in Supabase -> SQL Editor. Safe to re-run.
create extension if not exists "pgcrypto";

create table if not exists public.waitlist_survey (
  id         uuid primary key default gen_random_uuid(),
  email      text check (char_length(email) <= 320),
  location   text check (char_length(location) <= 40),
  answers    jsonb not null check (pg_column_size(answers) < 4000),
  created_at timestamptz not null default now()
);

alter table public.waitlist_survey enable row level security;

-- Anonymous visitors may add answers but cannot read anyone's.
drop policy if exists "anon can add survey answers" on public.waitlist_survey;
create policy "anon can add survey answers"
  on public.waitlist_survey
  for insert
  to anon
  with check (true);
