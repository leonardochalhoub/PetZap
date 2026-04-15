-- PetZap initial schema
-- All tables RLS-protected. Service-role bypasses RLS for webhook usage.

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists public.pets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  species     text not null check (species in ('dog','cat','bird','rabbit','other')),
  breed       text,
  birthdate   date,
  photo_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists pets_user_id_idx on public.pets(user_id);

create table if not exists public.vaccines (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references public.pets(id) on delete cascade,
  name        text not null,
  given_date  date not null,
  next_date   date,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists vaccines_pet_id_idx on public.vaccines(pet_id);
create index if not exists vaccines_next_date_idx on public.vaccines(next_date) where next_date is not null;

create table if not exists public.spendings (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references public.pets(id) on delete cascade,
  amount_cents  bigint not null check (amount_cents >= 0),
  currency      text not null default 'BRL' check (length(currency) = 3),
  category      text not null check (category in ('food','vet','toys','grooming','medicine','accessories','other')),
  spent_at      date not null default current_date,
  description   text,
  created_at    timestamptz not null default now()
);
create index if not exists spendings_pet_id_idx on public.spendings(pet_id);
create index if not exists spendings_spent_at_idx on public.spendings(spent_at);

create table if not exists public.whatsapp_links (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  phone         text not null unique,
  verified      boolean not null default false,
  otp_code      text,
  otp_expires_at timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists whatsapp_links_user_id_idx on public.whatsapp_links(user_id);

create table if not exists public.whatsapp_messages (
  id           uuid primary key default gen_random_uuid(),
  message_id   text unique,
  user_id      uuid references auth.users(id) on delete set null,
  phone        text not null,
  raw_text     text not null,
  parsed_json  jsonb,
  intent       text check (intent in ('vaccine','spending','unknown','onboarding')),
  status       text not null default 'received' check (status in ('received','parsed','failed','replied')),
  error        text,
  created_at   timestamptz not null default now()
);
create index if not exists whatsapp_messages_user_id_idx on public.whatsapp_messages(user_id);
create index if not exists whatsapp_messages_created_at_idx on public.whatsapp_messages(created_at desc);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists pets_set_updated_at on public.pets;
create trigger pets_set_updated_at before update on public.pets
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.pets              enable row level security;
alter table public.vaccines          enable row level security;
alter table public.spendings         enable row level security;
alter table public.whatsapp_links    enable row level security;
alter table public.whatsapp_messages enable row level security;

-- pets: owner-only
drop policy if exists pets_select_own on public.pets;
create policy pets_select_own on public.pets for select using (auth.uid() = user_id);
drop policy if exists pets_insert_own on public.pets;
create policy pets_insert_own on public.pets for insert with check (auth.uid() = user_id);
drop policy if exists pets_update_own on public.pets;
create policy pets_update_own on public.pets for update using (auth.uid() = user_id);
drop policy if exists pets_delete_own on public.pets;
create policy pets_delete_own on public.pets for delete using (auth.uid() = user_id);

-- vaccines: via pet ownership
drop policy if exists vaccines_select_own on public.vaccines;
create policy vaccines_select_own on public.vaccines for select
  using (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));
drop policy if exists vaccines_insert_own on public.vaccines;
create policy vaccines_insert_own on public.vaccines for insert
  with check (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));
drop policy if exists vaccines_update_own on public.vaccines;
create policy vaccines_update_own on public.vaccines for update
  using (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));
drop policy if exists vaccines_delete_own on public.vaccines;
create policy vaccines_delete_own on public.vaccines for delete
  using (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));

-- spendings: via pet ownership
drop policy if exists spendings_select_own on public.spendings;
create policy spendings_select_own on public.spendings for select
  using (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));
drop policy if exists spendings_insert_own on public.spendings;
create policy spendings_insert_own on public.spendings for insert
  with check (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));
drop policy if exists spendings_update_own on public.spendings;
create policy spendings_update_own on public.spendings for update
  using (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));
drop policy if exists spendings_delete_own on public.spendings;
create policy spendings_delete_own on public.spendings for delete
  using (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));

-- whatsapp_links: owner-only
drop policy if exists wal_select_own on public.whatsapp_links;
create policy wal_select_own on public.whatsapp_links for select using (auth.uid() = user_id);
drop policy if exists wal_insert_own on public.whatsapp_links;
create policy wal_insert_own on public.whatsapp_links for insert with check (auth.uid() = user_id);
drop policy if exists wal_update_own on public.whatsapp_links;
create policy wal_update_own on public.whatsapp_links for update using (auth.uid() = user_id);
drop policy if exists wal_delete_own on public.whatsapp_links;
create policy wal_delete_own on public.whatsapp_links for delete using (auth.uid() = user_id);

-- whatsapp_messages: owner-only read; writes only via service-role (no insert policy)
drop policy if exists wam_select_own on public.whatsapp_messages;
create policy wam_select_own on public.whatsapp_messages for select using (auth.uid() = user_id);
