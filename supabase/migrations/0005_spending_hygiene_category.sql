-- 0005 — Add 'hygiene' (Produtos de Higiene) to spending categories.
alter table public.spendings drop constraint if exists spendings_category_check;
alter table public.spendings add constraint spendings_category_check
  check (category in ('food','vet','toys','grooming','medicine','accessories','hygiene','other'));
