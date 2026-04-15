# PetZap Architecture

## Goals

- Track pets, vaccines (with next-due dates), and spendings for ~100 users
- Manual entry via web UI OR by texting WhatsApp
- 100% free stack
- Fast cold start, reliable, secure-by-default (RLS)

## System Components

### 1. Web (Next.js 14)

- **Pages**
  - `/` landing → redirects to `/dashboard` if authed
  - `/login`, `/signup` (Supabase Auth UI)
  - `/dashboard` — pets list + upcoming vaccines + recent spendings
  - `/pets/[id]` — pet detail (vaccines tab, spendings tab)
  - `/settings/whatsapp` — link your phone to your account

- **Server Actions** (`app/_actions/`)
  - `createPet`, `updatePet`, `deletePet`
  - `addVaccine`, `addSpending`
  - `linkWhatsappPhone`, `verifyWhatsappOTP`

- **Auth**: Supabase email magic-link + password. Server-side session via cookies.

### 2. Database (Supabase Postgres)

See [migrations/](../supabase/migrations/) for canonical schema.

**Tables:**
- `pets` — owned by `auth.users`
- `vaccines` — owned via `pets.user_id`
- `spendings` — owned via `pets.user_id`
- `whatsapp_links` — phone↔user mapping (verified via OTP)
- `whatsapp_messages` — audit log of every inbound WhatsApp message + parsed result

**RLS:** Every table has `enable row level security`. Policies allow only `auth.uid() = user_id` (or via pet ownership). The WhatsApp webhook uses the **service-role** key, bypassing RLS, and writes with the resolved `user_id`.

### 3. WhatsApp Ingestion

**Inbound flow:**
```
User WhatsApp → Meta Cloud API → POST /api/whatsapp/webhook
  → verify HMAC signature
  → resolve user_id from whatsapp_links (phone)
  → if unknown phone: reply "Link your account at <signup-url>"
  → else: call Gemini Flash with parsing prompt
  → parsed JSON → insert vaccine OR spending
  → reply with confirmation: "Logged: rabies vaccine for Rex on 2026-04-15. Next due: 2027-04-15."
```

**Gemini parsing prompt** returns one of:
```json
{ "intent": "vaccine", "pet_name": "Rex", "vaccine": "rabies", "given_date": "2026-04-15", "next_date": "2027-04-15" }
{ "intent": "spending", "pet_name": "Rex", "amount": 45.00, "currency": "BRL", "category": "food", "description": "premium kibble 5kg" }
{ "intent": "unknown", "reason": "Could not parse" }
```

If `pet_name` doesn't match any pet for that user, reply asking to clarify.

### 4. Local Deployment

`docker-compose.yml` runs:
- Supabase stack (db, auth, kong, studio, postgres-meta) via official compose
- Next.js dev server on `:3000`

Webhook testing locally via `ngrok http 3000` → put ngrok URL in Meta Developer Console.

## Security

- All tables RLS-on; service-role key only used in `/api/whatsapp/*` server-side
- HMAC verification on Meta webhook (`X-Hub-Signature-256`)
- WhatsApp phone linking requires OTP confirmation (prevents impersonation)
- Server Actions check `auth.uid()` via Supabase server client
- Secrets only in `.env.local` (never committed); `.env.example` is the template

## Cost Model

| Item | Free up to | Notes |
|------|-----------|-------|
| Supabase | 500MB DB, 50k MAU | Plenty for 100 users |
| Vercel (later) | 100 GB bandwidth/mo | If we deploy beyond local |
| Meta WhatsApp | 1000 service convos/mo | "Service" = user-initiated within 24h |
| Gemini 1.5 Flash | 1500 req/day | ~15 WhatsApp messages/user/day max |

Hard cost: $0 at 100 users.

## Out of Scope (v0)

- Mobile app
- Recurring reminder notifications (cron + push) — add in v1
- Multi-pet households shared between accounts
- Photo upload (planned, not in v0)
- Internationalization beyond pt-BR + en
