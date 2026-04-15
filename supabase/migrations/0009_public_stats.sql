-- 0009 — Public stats for the landing page: pet count, records count, landing visits counter.

-- Single-row counter table for generic site metrics.
create table if not exists public.site_counters (
  key        text primary key,
  value      bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.site_counters disable row level security;

insert into public.site_counters (key, value)
  values ('landing_visits', 0)
  on conflict (key) do nothing;

-- Atomic increment + return new value.
create or replace function public.increment_landing_visit()
returns bigint
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.site_counters (key, value)
  values ('landing_visits', 1)
  on conflict (key)
  do update set value = public.site_counters.value + 1, updated_at = now()
  returning value;
$$;

-- Public pet count (across ALL users — landing page social proof).
create or replace function public.pet_count()
returns integer
language sql
security definer
set search_path = public, pg_temp
as $$
  select count(*)::integer from public.pets;
$$;

-- Combined records count: vaccines + spendings + weights.
create or replace function public.records_count()
returns integer
language sql
security definer
set search_path = public, pg_temp
as $$
  select (
    (select count(*) from public.vaccines) +
    (select count(*) from public.spendings) +
    (select count(*) from public.pet_weights)
  )::integer;
$$;

revoke all on function public.increment_landing_visit() from public;
revoke all on function public.pet_count()               from public;
revoke all on function public.records_count()           from public;

grant execute on function public.increment_landing_visit() to anon, authenticated;
grant execute on function public.pet_count()               to anon, authenticated;
grant execute on function public.records_count()           to anon, authenticated;
