-- 0008 — Public RPC for the landing-page "signed-up users" counter.
-- SECURITY DEFINER so the anon role can call it without access to auth.users.
create or replace function public.user_count()
returns integer
language sql
security definer
set search_path = public, pg_temp
as $$
  select count(*)::integer from auth.users;
$$;

revoke all on function public.user_count() from public;
grant execute on function public.user_count() to anon, authenticated;
