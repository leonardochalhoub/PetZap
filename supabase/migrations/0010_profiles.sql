-- 0010 — Move identity fields out of auth.user_metadata into a real public.profiles table.
-- Keeps existing auth flow; adds a clean, queryable, RLS-guarded row per user.

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  treatment  text check (treatment in ('male','female','neutral')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select
  using (auth.uid() = id);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- No insert policy: rows are created by the trigger (service-role context).

-- updated_at trigger
create or replace function public.profiles_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.profiles_set_updated_at();

-- Sync from auth.users on insert / metadata change.
create or replace function public.handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  _full_name text := nullif(coalesce(new.raw_user_meta_data ->> 'full_name', ''), '');
  _treatment text := nullif(coalesce(new.raw_user_meta_data ->> 'treatment', ''), '');
begin
  insert into public.profiles (id, email, full_name, treatment)
  values (new.id, new.email, _full_name, _treatment)
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        treatment = coalesce(excluded.treatment, public.profiles.treatment);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_change();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_auth_user_change();

-- Backfill existing users from auth.users → profiles
insert into public.profiles (id, email, full_name, treatment)
select
  u.id,
  u.email,
  nullif(coalesce(u.raw_user_meta_data ->> 'full_name', ''), ''),
  nullif(coalesce(u.raw_user_meta_data ->> 'treatment', ''), '')
from auth.users u
on conflict (id) do nothing;
