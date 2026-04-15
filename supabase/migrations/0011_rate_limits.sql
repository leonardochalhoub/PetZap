-- 0011 — Simple DB-backed rate limiter.
-- One row per (bucket, key) counting requests inside a rolling window.

create table if not exists public.rate_limits (
  bucket       text not null,
  key          text not null,
  window_start timestamptz not null default now(),
  count        integer not null default 0,
  primary key (bucket, key)
);

alter table public.rate_limits disable row level security;
create index if not exists rate_limits_window_idx on public.rate_limits(window_start);

-- Atomic bump.
-- Returns the count INCLUDING the current call. If > limit → caller rejects.
-- If the oldest entry in the window is older than window_seconds, we reset.
create or replace function public.rate_limit_hit(
  p_bucket text,
  p_key    text,
  p_window_seconds integer,
  p_limit  integer
)
returns table (allowed boolean, current_count integer, reset_in_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  row_now timestamptz := now();
  rec public.rate_limits%rowtype;
begin
  insert into public.rate_limits (bucket, key, window_start, count)
  values (p_bucket, p_key, row_now, 1)
  on conflict (bucket, key) do update
    set window_start = case
          when public.rate_limits.window_start < row_now - make_interval(secs => p_window_seconds)
            then row_now
          else public.rate_limits.window_start
        end,
        count = case
          when public.rate_limits.window_start < row_now - make_interval(secs => p_window_seconds)
            then 1
          else public.rate_limits.count + 1
        end
  returning * into rec;

  allowed := rec.count <= p_limit;
  current_count := rec.count;
  reset_in_seconds := greatest(
    0,
    p_window_seconds - extract(epoch from (row_now - rec.window_start))::integer
  );
  return next;
end $$;

revoke all on function public.rate_limit_hit(text, text, integer, integer) from public;
grant execute on function public.rate_limit_hit(text, text, integer, integer) to anon, authenticated, service_role;
