-- 0004 — Allow reordering pets on the dashboard via drag-and-drop.
-- NULL = "no manual order yet" (sort to end, then by created_at).

alter table public.pets
  add column if not exists sort_order integer;

create index if not exists pets_sort_order_idx on public.pets(sort_order nulls last);
