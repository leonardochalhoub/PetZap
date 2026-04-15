-- 0012 — Telegram bot integration tables.
-- Replaces the blocked WhatsApp path while keeping the same intent parsing + Gemini flow.

-- telegram_links: one active link per user, chat_id is the Telegram-side identity.
-- Two-phase lifecycle:
--   1. User clicks "Connect Telegram" on site → row created with link_token but no chat_id
--   2. User opens deep link, hits /start <link_token> → webhook fills chat_id + verified=true
create table if not exists public.telegram_links (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  chat_id      bigint unique,
  username     text,
  first_name   text,
  last_name    text,
  link_token   text unique,
  verified     boolean not null default false,
  linked_at    timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists telegram_links_user_id_idx  on public.telegram_links(user_id);
create index if not exists telegram_links_chat_id_idx  on public.telegram_links(chat_id) where chat_id is not null;
create index if not exists telegram_links_token_idx    on public.telegram_links(link_token) where link_token is not null;

-- telegram_messages: idempotent message log, mirrors whatsapp_messages structure.
create table if not exists public.telegram_messages (
  id           uuid primary key default gen_random_uuid(),
  update_id    bigint unique,
  message_id   bigint,
  chat_id      bigint not null,
  user_id      uuid references auth.users(id) on delete set null,
  raw_text     text not null,
  parsed_json  jsonb,
  intent       text check (intent in ('vaccine','spending','unknown','onboarding','link')),
  status       text not null default 'received' check (status in ('received','parsed','failed','replied')),
  error        text,
  created_at   timestamptz not null default now()
);
create index if not exists telegram_messages_chat_id_idx    on public.telegram_messages(chat_id);
create index if not exists telegram_messages_user_id_idx    on public.telegram_messages(user_id);
create index if not exists telegram_messages_created_at_idx on public.telegram_messages(created_at desc);

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.telegram_links    enable row level security;
alter table public.telegram_messages enable row level security;

-- telegram_links: owner-only (service-role bypasses RLS for webhook writes)
drop policy if exists tgl_select_own on public.telegram_links;
create policy tgl_select_own on public.telegram_links for select using (auth.uid() = user_id);
drop policy if exists tgl_insert_own on public.telegram_links;
create policy tgl_insert_own on public.telegram_links for insert with check (auth.uid() = user_id);
drop policy if exists tgl_update_own on public.telegram_links;
create policy tgl_update_own on public.telegram_links for update using (auth.uid() = user_id);
drop policy if exists tgl_delete_own on public.telegram_links;
create policy tgl_delete_own on public.telegram_links for delete using (auth.uid() = user_id);

-- telegram_messages: owner-only read; writes only via service-role
drop policy if exists tgm_select_own on public.telegram_messages;
create policy tgm_select_own on public.telegram_messages for select using (auth.uid() = user_id);
