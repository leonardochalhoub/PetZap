-- 0013 — Admin flag on profiles.
-- Admins see the /admin area with macro stats and per-user drill-in.
-- RLS stays owner-only for regular reads; the admin area uses the
-- service-role client to bypass RLS when reading cross-user data.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create index if not exists profiles_is_admin_idx
  on public.profiles(is_admin) where is_admin = true;

-- Seed the initial admin.
update public.profiles
  set is_admin = true
where email = 'leochalhoub@hotmail.com';
