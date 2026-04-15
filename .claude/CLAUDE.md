# PetZap — Pet Management Web App

## Project Overview

SaaS prototype for pet owners to track animals, vaccines (history + next dates), and spendings.
Entries can be created manually via web UI **or** by sending text to a WhatsApp number that gets
parsed by an LLM into structured records.

**Constraints:** ~100 users, fully free stack, fast, reliable.

## Architecture

```
+------------------+      +------------------+      +------------------+
|  USER (Web)      |      |  USER (WhatsApp) |      |   LLM PARSER     |
|  Next.js UI      |      |  Meta Cloud API  |      |  Gemini 1.5 Flash|
+--------+---------+      +--------+---------+      +--------+---------+
         |                         |                         ^
         v                         v                         |
+------------------+      +------------------+               |
|   Next.js API    |      |  /api/whatsapp   |---------------+
|   Server Actions |      |   webhook        |
+--------+---------+      +--------+---------+
         |                         |
         +-----------+-------------+
                     v
            +------------------+
            |    SUPABASE      |
            |  Postgres + Auth |
            |  + RLS policies  |
            +------------------+
```

## Stack (100% Free)

| Layer | Tool | Free tier |
|-------|------|-----------|
| Frontend + API | Next.js 14 (App Router) + TS + Tailwind + shadcn/ui | Self-hosted; Vercel free later |
| DB + Auth | Supabase (local Docker, cloud free tier) | 500MB DB, 50k MAU, 5GB egress |
| WhatsApp | Meta WhatsApp Business Cloud API (direct) | 1000 service conversations/mo |
| LLM | Google Gemini 1.5 Flash | 1500 req/day, 15 RPM |
| Local deploy | Docker Compose | — |

## Data Model

```sql
auth.users (Supabase managed)
  |
  +-- pets (id, user_id FK, name, species, breed, birthdate, photo_url)
        |
        +-- vaccines (id, pet_id FK, name, given_date, next_date, notes)
        +-- spendings (id, pet_id FK, amount_cents, currency, category, spent_at, description)

whatsapp_messages (id, user_id FK, raw_text, parsed_json, intent, status, created_at)
whatsapp_links (phone E.164 -> user_id, verified bool)
```

All tables RLS-protected: a user can only read/write rows where `user_id = auth.uid()`.

## Folder Layout

```
pet-saas/
  .claude/
    CLAUDE.md                        # This file
    agents/                          # Project-specific subagents
      saas-architect.md
      nextjs-fullstack-builder.md
      supabase-schema-builder.md
      whatsapp-ingestion-builder.md
  docs/
    ARCHITECTURE.md                  # Detailed system design
  supabase/
    config.toml                      # Supabase CLI config
    migrations/                      # SQL migrations
    seed.sql                         # Demo data
  web/                               # Next.js app
    app/                             # App Router pages + API routes
    components/
    lib/
    package.json
  whatsapp/                          # Webhook handlers + Gemini parser
  docker-compose.yml                 # Local Supabase + Next.js
  .env.example
  README.md
```

## Conventions

- TypeScript everywhere (web + whatsapp)
- Server Components by default; Client Components only when needed
- Server Actions for mutations (no separate REST API where avoidable)
- Zod for validation (mirror Supabase schema)
- All amounts stored as `amount_cents` (integer) to avoid float issues
- Dates stored as `date` for vaccines, `timestamptz` for events
- RLS = the only authorization layer (no app-side checks)
