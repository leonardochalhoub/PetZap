-- 0002 — Add sex + neutered to pets, create pet_weights with history.
-- Idempotent. RLS via pet ownership.

-- ============================================================================
-- pets: sex + neutered
-- ============================================================================

alter table public.pets
  add column if not exists sex text,
  add column if not exists neutered boolean not null default false;

-- Re-add the check constraint idempotently (drop if exists pattern via DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pets_sex_check'
  ) then
    alter table public.pets
      add constraint pets_sex_check check (sex is null or sex in ('male','female'));
  end if;
end $$;

-- ============================================================================
-- pet_weights: history of weight measurements
-- ============================================================================

create table if not exists public.pet_weights (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references public.pets(id) on delete cascade,
  weight_kg   numeric(5,2) not null check (weight_kg > 0 and weight_kg < 200),
  measured_at date not null default current_date,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists pet_weights_pet_id_idx on public.pet_weights(pet_id);
create index if not exists pet_weights_measured_at_idx on public.pet_weights(measured_at desc);

-- ============================================================================
-- RLS — pet_weights via pet ownership
-- ============================================================================

alter table public.pet_weights enable row level security;

drop policy if exists pet_weights_select_own on public.pet_weights;
create policy pet_weights_select_own on public.pet_weights for select
  using (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));

drop policy if exists pet_weights_insert_own on public.pet_weights;
create policy pet_weights_insert_own on public.pet_weights for insert
  with check (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));

drop policy if exists pet_weights_update_own on public.pet_weights;
create policy pet_weights_update_own on public.pet_weights for update
  using (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));

drop policy if exists pet_weights_delete_own on public.pet_weights;
create policy pet_weights_delete_own on public.pet_weights for delete
  using (exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid()));
