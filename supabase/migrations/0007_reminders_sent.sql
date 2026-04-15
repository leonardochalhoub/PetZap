-- 0007 — Track sent reminder emails to avoid duplicates.
-- A reminder is uniquely identified by (event_type, event_id, weeks_before).
create table if not exists public.reminders_sent (
  event_type   text not null check (event_type in ('vaccine', 'medication')),
  event_id     uuid not null,
  weeks_before integer not null check (weeks_before in (1, 2)),
  sent_at      timestamptz not null default now(),
  primary key (event_type, event_id, weeks_before)
);

create index if not exists reminders_sent_event_idx
  on public.reminders_sent(event_type, event_id);

-- Cron route uses service-role; no RLS policies needed (RLS off).
alter table public.reminders_sent disable row level security;
