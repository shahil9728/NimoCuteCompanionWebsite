-- Lets the website show how many people joined, without letting anyone read the emails.
-- Run once in Supabase -> SQL Editor. Safe to re-run.
create or replace function public.waitlist_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.waitlist;
$$;

revoke all on function public.waitlist_count() from public;
grant execute on function public.waitlist_count() to anon, authenticated;
