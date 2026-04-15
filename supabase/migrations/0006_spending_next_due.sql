-- 0006 — Recurring spendings (medications, hygiene products, etc.)
-- next_due = next time the user expects to spend on this; nullable for one-off purchases.
alter table public.spendings
  add column if not exists next_due date;

create index if not exists spendings_next_due_idx
  on public.spendings(next_due) where next_due is not null;
