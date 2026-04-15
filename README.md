<div align="center">

# PetZap

**The easiest way to keep your pet's health, spending, and vaccine schedule in one place.**

Full-stack SaaS for pet owners — built with Next.js 16, Supabase, and a WhatsApp-first data capture flow.

[![CI](https://github.com/leonardochalhoub/PetZap/actions/workflows/ci.yml/badge.svg)](https://github.com/leonardochalhoub/PetZap/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## Table of contents

- [What it does](#what-it-does)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project layout](#project-layout)
- [Quickstart](#quickstart)
- [Environment variables](#environment-variables)
- [Database](#database)
- [WhatsApp ingestion](#whatsapp-ingestion)
- [Email reminders](#email-reminders)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Roadmap](#roadmap)
- [License](#license)

---

## What it does

PetZap is a multi-tenant pet management app designed for **100 users on free-tier infrastructure**. It helps owners track everything that matters for their pets without friction.

### Core features

| Feature | Description |
|---|---|
| **Pet profiles** | Name, species, breed, sex, birth date, weight history, photo gallery. Drag-and-drop reorder. |
| **Vaccines** | Schedule + history with next-dose calculation. One-click "+1 year" for annual doses. |
| **Spendings** | Categorized expenses (food, medication, hygiene, etc.) with charts and 6-month projections. |
| **Medications** | Recurring prescriptions with auto-calculated next-due dates. |
| **WhatsApp capture** | Forward a message like _"comprei ração 120 reais"_ to the bot — Gemini parses it, saves the spending to the right pet. |
| **Email reminders** | Daily cron finds vaccines/meds due in 7 and 14 days, emails the owner. Idempotent via `reminders_sent`. |
| **Dashboard** | 8 KPI tiles, Plotly spending chart, pie breakdown, weight delta chart, upcoming-alerts banner. |
| **Data export** | One-click JSON dump of everything the user owns. Rate-limited, LGPD-friendly. |
| **Dark / light theme** | SSR-safe via `next-themes`. Auto-detects system preference. |
| **i18n** | Full PT-BR and EN dictionaries with **inclusive gendered treatment** (Bem-vindo / Bem-vinda / Bem-vinde). |
| **Landing page** | Hero carousel, typing banner, live signup stats pulled from SQL, cookie consent banner. |

---

## Screenshots

<div align="center">
<table>
<tr>
<td><img src="web/public/carousel/20180610_113044.webp" alt="Pet carousel 1" width="280"/></td>
<td><img src="web/public/carousel/20190907_115016.webp" alt="Pet carousel 2" width="280"/></td>
<td><img src="web/public/carousel/IMG-20250521-WA0001.webp" alt="Pet carousel 3" width="280"/></td>
</tr>
<tr>
<td colspan="3" align="center"><sub><b>Landing page carousel — the pets PetZap is built for</b></sub></td>
</tr>
</table>
</div>

---

## Architecture

```
                        ┌─────────────────────────┐
                        │      Browser (SPA)      │
                        │   Next.js 16 + React 19 │
                        └────────────┬────────────┘
                                     │  Server Actions / RSC
                                     ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                 Next.js server (Vercel Edge+Node)            │
    │                                                              │
    │   ┌───────────────┐   ┌──────────────┐   ┌────────────────┐  │
    │   │ Server Actions│   │ API routes   │   │ Cron (daily)   │  │
    │   │ auth / pets / │   │ /export      │   │ /cron/reminders│  │
    │   │ vaccines /    │   │ /whatsapp    │   └────────┬───────┘  │
    │   │ spendings /   │   │   /webhook   │            │          │
    │   │ whatsapp /    │   └──────┬───────┘            │          │
    │   │ weights       │          │                    │          │
    │   └───────┬───────┘          │                    │          │
    │           │                  │                    │          │
    │           ▼                  ▼                    ▼          │
    │   ┌──────────────┐   ┌──────────────┐   ┌────────────────┐   │
    │   │ zod schemas  │   │ rate-limit   │   │ structured log │   │
    │   │ input valid. │   │ RPC (DB)     │   │ + Sentry hook  │   │
    │   └──────────────┘   └──────────────┘   └────────────────┘   │
    └───────────────────────────┬──────────────────────────────────┘
                                │
        ┌───────────────────────┼──────────────────────┐
        ▼                       ▼                      ▼
  ┌───────────┐         ┌───────────────┐      ┌───────────────┐
  │ Supabase  │         │ Google Gemini │      │ Resend        │
  │ Postgres  │         │ 2.5 Flash     │      │ transactional │
  │ + Auth    │         │ (NLU parse)   │      │ email         │
  │ + Storage │         └───────────────┘      └───────────────┘
  │ + RLS     │
  └───────────┘
```

**Design principles:**

- **Row-Level Security everywhere.** Every table has `user_id` and policies that scope reads/writes to `auth.uid()`.
- **Server Actions over REST.** Mutations are colocated with UI, validated with zod, type-safe end-to-end.
- **DB-backed rate limits.** No Redis — a single `rate_limit_hit(bucket, key, window_seconds, limit)` RPC with fail-open fallback.
- **Structured JSON logging.** Every log has `event`, `level`, context — Sentry is loaded via dynamic import so local dev stays lean.
- **Idempotent email.** `reminders_sent(event_id, weeks_before)` unique constraint prevents duplicates across cron retries.

---

## Tech stack

### Frontend
- **Next.js 16** (App Router, Turbopack, React Server Components, Server Actions)
- **React 19** with concurrent features and `useActionState`
- **TypeScript** strict mode
- **Tailwind CSS v4** — CSS-first `@theme`, `@variant dark`
- **next-themes** — SSR-safe dark mode
- **Plotly.js basic-dist-min** — lazy-loaded charts via `next/dynamic`
- **Recharts** — simpler chart widgets (pie, weight delta)

### Backend
- **Supabase** — Postgres, Auth (email + password + magic link), Storage (pet photos), Management API for migrations
- **Google Gemini 2.5 Flash** — `responseSchema`-based structured output for PT-BR NLU
- **Meta WhatsApp Business Cloud API** — inbound webhook with HMAC-SHA256 signature verification
- **Resend** — transactional email
- **Sentry** — error tracking (optional, dynamic import)

### Dev / quality
- **Vitest** — 33 unit tests covering money, dates, i18n, breeds, reminder logic
- **GitHub Actions** — CI: `tsc --noEmit` + lint + test + build on every PR
- **sharp** — WebP compression for carousel assets (2.5 MB JPG → 399 KB WebP)
- **zod** — runtime validation at every server-action boundary
- **Turbopack** — dev server + prod build

---

## Project layout

```
petzap-saas/
├── README.md
├── LICENSE
├── vercel.json                   # Cron: 09:00 UTC → /api/cron/reminders
├── .github/workflows/ci.yml      # typecheck + test + build
├── .env.example
│
├── supabase/
│   └── migrations/               # 0001 → 0011 (init, pets, vaccines,
│                                 # spendings, reminders_sent, profiles,
│                                 # rate_limits, user_count RPC, etc.)
│
├── whatsapp/                     # Reference scripts for Meta App setup
│
├── docs/                         # Architecture notes
│
└── web/
    ├── app/
    │   ├── (auth)/               # login, signup, forgot-password, reset
    │   ├── (app)/                # dashboard, pets/[id], settings
    │   ├── api/
    │   │   ├── cron/reminders/   # daily email job (Bearer CRON_SECRET)
    │   │   ├── export/           # JSON dump of user-owned rows
    │   │   └── whatsapp/webhook/ # Meta inbound webhook
    │   ├── page.tsx              # landing
    │   └── layout.tsx            # theme + i18n + cookie consent
    │
    ├── components/               # 30+ React components
    │   ├── dashboard/kpi-grid.tsx
    │   ├── charts/               # Plotly wrappers
    │   └── …
    │
    ├── lib/
    │   ├── actions/              # Server Actions (auth, pets, vaccines,
    │   │                         #   spendings, weights, whatsapp, locale)
    │   ├── supabase/             # ssr, admin, browser clients
    │   ├── whatsapp/             # verify, parse, persist, send, schemas
    │   ├── email/                # reminder template + send helper
    │   ├── log.ts                # structured logger + dynamic Sentry
    │   ├── rate-limit.ts         # RPC helper + 429 response builder
    │   └── breeds.ts             # curated PT-BR breed list
    │
    ├── i18n/messages/            # en.ts + pt-BR.ts (type-safe, keys locked in tests)
    │
    └── tests/                    # Vitest: breeds, money, reminder, i18n, date-math
```

---

## Quickstart

### Prerequisites

- **Node.js 20+**
- A free **Supabase** project ([supabase.com](https://supabase.com))
- A **Google AI Studio** API key for Gemini ([aistudio.google.com/apikey](https://aistudio.google.com/apikey))
- _(optional)_ **Resend** account for email ([resend.com](https://resend.com))
- _(optional)_ **Meta WhatsApp Business** app for ingestion

### 1. Clone & install

```bash
git clone https://github.com/leonardochalhoub/PetZap.git
cd PetZap/web
npm install
```

### 2. Configure environment

```bash
cp ../.env.example .env.local
# Fill in Supabase URL, anon key, service-role key, Gemini key, etc.
```

See [Environment variables](#environment-variables) for the full list.

### 3. Apply database migrations

```bash
# Using Supabase CLI (recommended)
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# OR paste each file in supabase/migrations/*.sql into the Supabase SQL editor
```

After new migrations, reload the PostgREST schema cache:

```sql
notify pgrst, 'reload schema';
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up → verify email → you're in.

### 5. (Optional) Trigger the reminder cron locally

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/cron/reminders
```

---

## Environment variables

| Variable | Required | Description |
|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Anon key — safe for client |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **Server-only.** Used by admin client + cron |
| `GEMINI_API_KEY` | yes | For WhatsApp NLU parsing |
| `META_VERIFY_TOKEN` | for WhatsApp | Arbitrary string — must match Meta console |
| `META_APP_SECRET` | for WhatsApp | From App Settings → Basic |
| `META_PHONE_NUMBER_ID` | for WhatsApp | From WhatsApp API Setup |
| `META_ACCESS_TOKEN` | for WhatsApp | Permanent System User token preferred |
| `RESEND_API_KEY` | for email | From [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | for email | Verified sender — e.g. `PetZap <no-reply@yourdomain.com>` |
| `EMAIL_TEST_OVERRIDE` | dev only | Forces all outbound mail to this address (Resend free tier) |
| `CRON_SECRET` | yes | Bearer token required by `/api/cron/reminders` |
| `SENTRY_DSN` | no | Enables error tracking |
| `NEXT_PUBLIC_APP_URL` | yes | `http://localhost:3000` or `https://petzap.app` |

---

## Database

Eleven migrations define the full schema. Key tables:

| Table | Purpose |
|---|---|
| `profiles` | 1-1 with `auth.users` — name, email, treatment (m/f/n). Backfilled + trigger-maintained. |
| `pets` | Owned by user. Has `sort_order` for drag-and-drop. |
| `pet_photos` | Storage-backed photo gallery with zoom metadata. |
| `vaccines` | History + next-dose dates. |
| `spendings` | Categorized expenses. Supports recurrence via `next_due_at`. |
| `weights` | Time series for weight chart. |
| `reminders_sent` | Idempotency: unique on `(event_id, weeks_before)`. |
| `rate_limits` | Rolling-window counters for the `rate_limit_hit` RPC. |
| `public_stats` | Cached counts for landing page (no PII). |

Every user-owned table has RLS enabled with `auth.uid() = user_id` on SELECT / INSERT / UPDATE / DELETE.

---

## WhatsApp ingestion

```
┌─────────────┐   POST     ┌──────────────────┐   parse    ┌──────────────┐
│ User's      │  webhook   │ /api/whatsapp/   │  ─────►    │ Gemini 2.5   │
│ WhatsApp    │ ─────────► │   webhook        │            │ Flash        │
│ (Meta)      │            │                  │  ◄─────    │ structured   │
└─────────────┘            │ 1. verify HMAC   │   JSON     │ response     │
                           │ 2. rate-limit    │            └──────────────┘
                           │ 3. parse (NLU)   │
                           │ 4. persist row   │
                           │ 5. send receipt  │
                           └──────────────────┘
```

Supported intents: `spending`, `vaccine`, `weight`, `note`. Gemini returns a typed JSON object matching a zod schema; persistence picks the right table based on `intent`.

Example: _"gastei 80 reais de ração premium pro Rex"_ → `{ intent: "spending", pet: "Rex", category: "food", amount_brl: 80, note: "ração premium" }`.

---

## Email reminders

Daily cron at **09:00 UTC** (`vercel.json`) finds everything due in **7 ± 1** and **14 ± 1** days across vaccines + recurring meds, then:

1. Deduplicates via `reminders_sent(event_id, weeks_before)` unique key.
2. Renders PT-BR/EN-aware HTML template.
3. Sends via Resend.
4. Logs structured events: `reminder.sent`, `reminder.skipped`, `reminder.error`.

Endpoint: `POST /api/cron/reminders`
Auth: `Authorization: Bearer $CRON_SECRET`
Rate-limit: 30/hr per client.

---

## Internationalization

Two dictionaries live at `web/i18n/messages/`:

- `en.ts` — source of truth, exports `type Messages`.
- `pt-BR.ts` — must mirror `en.ts` key-for-key (enforced by [i18n.test.ts](web/tests/i18n.test.ts)).

**Inclusive gendered treatment** — users pick male / female / neutral at signup:

```ts
welcomeBack: {
  male:    "Bem-vindo de volta, {name}",
  female:  "Bem-vinda de volta, {name}",
  neutral: "Bem-vinde de volta, {name}",
}
```

Species + breeds also gendered (`speciesGendered.dog.male` → "cachorro", `female` → "cadela").

Locale is detected from `Accept-Language`, overridable via `/api/locale`.

---

## Testing

```bash
npm test           # watch mode
npm run test:ci    # single pass (used by CI)
npm run typecheck  # tsc --noEmit
```

**33 tests across 5 files:**

| File | What it covers |
|---|---|
| `breeds.test.ts` | Breed list integrity, no duplicates, PT-BR canonicalization |
| `money.test.ts` | Cent/BRL formatting round-trips |
| `reminder.test.ts` | 7-day / 14-day window math, edge cases |
| `i18n.test.ts` | EN ↔ PT-BR key parity, no empty strings, gendered fields complete |
| `date-math.test.ts` | `+1 year` helper (leap year quirk pinned), XFF parsing |

CI runs the same commands on every PR via `.github/workflows/ci.yml`.

---

## Deployment

**Vercel** is the recommended target — the project is wired for it:

1. Import the repo in the Vercel dashboard.
2. Set the same env vars from `.env.local` in Project Settings → Environment Variables.
3. `vercel.json` already declares the daily cron at 09:00 UTC.
4. Push to `main`. Done.

> **Note:** GitHub Pages cannot host this app — it's a dynamic Next.js app with Server Actions, API routes, and server-side Supabase calls. GitHub Pages only serves static files.

---

## Security

- **RLS on every user-scoped table.** No server code relies on filtering by `user_id` — the DB enforces it.
- **Service-role key never leaves the server.** Admin client is lazy-instantiated in Node runtime handlers only.
- **HMAC verification** on WhatsApp webhook using `META_APP_SECRET`.
- **Rate limits** on public endpoints: 30/hr cron, 5/hr/user export, 600/hr webhook, 3/hr/email forgot-password.
- **zod validation** at every server-action and API route boundary.
- **Cookie consent** banner (LGPD/GDPR).
- **No secrets in client bundles.** `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `META_APP_SECRET`, `RESEND_API_KEY`, `CRON_SECRET` are all server-only.
- **Sentry** DSN is public by design, but loaded via dynamic import to keep bundle lean.

If you discover a vulnerability, please email `leonardochalhoub@gmail.com` rather than filing a public issue.

---

## Roadmap

- [ ] Resend domain verification (currently free tier → test email only)
- [ ] Petlove product scraping (Cloudflare-blocked anon scraping — needs alternate source)
- [ ] Phone login via Twilio SMS
- [ ] Push notifications for reminders (web push + FCM)
- [ ] PDF export in addition to JSON
- [ ] Shared pet profiles (vet or family member read-only access)
- [ ] Vaccine dose auto-suggestion from species + age

---

## License

[MIT](LICENSE) © Leonardo Chalhoub
