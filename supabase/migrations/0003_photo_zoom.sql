-- 0003 — Allow per-pet photo zoom (1.0 = no zoom, up to 3x).
alter table public.pets
  add column if not exists photo_zoom numeric(3,2) not null default 1.00;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pets_photo_zoom_check') then
    alter table public.pets
      add constraint pets_photo_zoom_check check (photo_zoom > 0 and photo_zoom <= 5);
  end if;
end $$;
