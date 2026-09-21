# SwiftDrop — Local Delivery Platform

A working, tested delivery platform for the Canadian market: merchants book
deliveries, couriers are dispatched automatically, customers track them live,
and admins run the whole thing from one panel. Everything below is
implemented and verified — 19 end-to-end regression checks pass against a
production build.

Placeholder brand name **"SwiftDrop"** — search/replace it once you pick a
real name.

## Quick start

**Prerequisite:** Node.js 22+ (the database uses Node's built-in `node:sqlite`).

```bash
npm install
npm run setup                 # creates .env with a real NEXTAUTH_SECRET
npm run seed                  # test accounts, zones + two weeks of demo history
npm run dev                   # http://localhost:3000
```

`npm run setup` works the same on Windows, macOS and Linux — no `openssl`
needed. On Windows PowerShell the three commands above run as-is.

The seed also creates a fortnight of completed deliveries for the demo
courier, two recurring schedules and a couple of API keys for the merchant,
so the earnings, Courier+ tier, pay-transparency and webhook screens have
real data in them the first time you open the app.

**Test accounts** (password `password123` for all):

| Account | What it shows |
|---|---|
| `merchant@example.com` | Approved merchant — can book deliveries |
| `courier@example.com` | Approved courier — can go online and take offers |
| `admin@example.com` | Internal operations console (kept off the public site) |
| `pending-merchant@example.com` | Sitting in the approval queue |
| `pending-courier@example.com` | Sitting in the approval queue |

**See the whole thing work in 5 minutes:** sign in as the merchant, create a
delivery. Open a second browser as the courier, go online (allow location),
accept the offer, mark picked up, then delivered with a photo. Open the
tracking link as the customer — the courier moves on the map live. Sign in as
admin to watch it all on the live map.

## The public website

`/`, `/features`, `/pricing` and `/couriers` are the marketing site — light
and dark themes, and the product shots on them are real captures of the
running app (`public/screenshots/`), not mockups.

**The admin panel is deliberately invisible from the public site.** Nothing
in the navigation, footer, copy, page metadata or sitemap mentions it;
`robots.txt` disallows `/admin`, `/merchant`, `/driver`, `/track` and `/api`;
and `/admin` carries `noindex, nofollow`. The demo credentials on the login
page only render outside production. Admins reach the console by URL — the
handful of people who need it will be set up directly.

## What's built

### Step 1 — Onboarding & accounts
Self-signup for merchants (with KYB details) and couriers (vehicle, licence,
insurance). Identity documents upload to a private folder, viewable only by
admins through an authenticated route — never from `/public`. Admin approval
queue with approve/reject/suspend. Unapproved merchants can't book and
unapproved couriers can't go online, enforced server-side.

### Step 2 — Addresses & dispatch engine
Address autocomplete and geocoding (Photon/OpenStreetMap by default — no API
key; swap to Google/Mapbox via `GEOCODER` in `.env`). Real road distance and
ETA via OSRM, falling back to a detour-adjusted straight line when routing is
unreachable, so pricing never silently breaks. Delivery time windows.
**Auto-dispatch**: the system offers each order to the nearest suitable
courier with a 45-second countdown, moves on when they decline or the timer
expires, ranks Pro/Gold couriers first, and falls back to an open broadcast
so nothing gets stuck. Admin manual assign/unassign override. Failed
deliveries become a proper return-to-merchant flow instead of a dead end.

### Step 3 — Notifications, chat & two-way ratings
SMS/email on every lifecycle event (tracking link, courier assigned, picked
up, delivered, returning). Works with no provider configured: messages are
rendered and logged to an admin-visible audit table, and adding Twilio/Resend
keys switches them to real sends with no code change. Per-delivery chat
between courier and customer with **no phone numbers exposed** on either
side. Two-way ratings — couriers rate merchants, and the gap between "I'm at
the pickup" and actual pickup gives you a real **average pickup wait per
merchant**, so you can see which merchants are burning courier time.

### Step 4 — Scale & courier economics
Multi-stop **route batching** with nearest-neighbour + 2-opt optimization
(measured 57% shorter than unordered on the test route) — this is the core
cost lever. Surge pricing per zone, capped at 3x, which raises the courier's
share too. Bulk CSV upload that reports bad rows by line number and still
creates the good ones. Public **merchant API** (`/api/v1/orders`) with hashed
API keys and outbound webhooks. Recurring/standing deliveries. Courier
challenges with live progress bars, demand heat map, and a payout ledger with
free weekly or 1.5%-fee instant cash-out.

### Step 5 — Compliance, trust & support
English/French with locale from `?lang=`, saved preference, or
`Accept-Language` — the customer-facing tracking page is fully translated
(relevant for Quebec). **Age verification** for alcohol/pharmacy: delivery
cannot be completed until the ID check is recorded, and a refusal
automatically sends the parcel back. Temperature-sensitive handling flags.
**Pay transparency** statement for couriers (engaged time, earnings,
effective hourly, how pay is calculated) aligned with Ontario's Digital
Platform Workers' Rights Act. Disputes/claims workflow with refunds.
**Fraud detection** — GPS spoofing via impossible speed, reused
proof-of-delivery photos, implausibly fast deliveries, excessive failures —
all flagged for human review, never auto-punished. Courier supply
forecasting. Full **support ticket system** wired into the admin panel, open
even to customers with no account, with internal notes hidden from requesters.

## Not built yet (deliberately)

- **Payments** — no Stripe. Merchants aren't charged and payouts are marked
  paid manually by an admin. This was left for last by design; the ledger and
  request flow are already in place, so connecting Stripe Connect means
  filling in one function.
- **Shopify app** — the public API it would call is ready.
- **Native mobile apps** — the driver app is mobile-web and works on a phone.
- **Masked voice calls** — chat covers the common case; Twilio Proxy would
  add real masked calling on top.

## Project structure

```
scripts/seed.ts          test data
src/
  app/
    merchant/            portal: orders, tools & API, support
    driver/              offers, demand & routes, earnings, pay, documents
    admin/               ops, live map, orders, applications, operations,
                         trust & support, forecast, notifications
    track/[orderId]/     public customer tracking (bilingual)
    signup/              merchant + courier self-signup
    api/                 all backend routes (v1/ is the public merchant API)
  lib/
    db.ts                SQLite connection, schema + in-place migrations
    repo.ts              every database read/write
    dispatch.ts          auto-dispatch engine
    batching.ts          route optimization (nearest-neighbour + 2-opt)
    orders.ts            shared order creation (portal/CSV/API/recurring)
    geo.ts               geocoding + routing with graceful fallback
    pricing.ts           zone pricing, surge, courier tiers
    notify.ts            SMS/email with provider fallback
    fraud.ts             trust & safety rules
    i18n.ts              English/French
    guards.ts, session.ts, apiAuth.ts, recurring.ts, batchService.ts
  components/            UI (live map, chat, offers, admin panels…)
  middleware.ts          role-based route protection
```

## Scheduled jobs (for production)

Dispatch, batching and recurring orders currently advance whenever someone
has the app open. In production, also hit these on a schedule:

```
*/1 * * * *   POST /api/dispatch          # move the offer queue along
*/5 * * * *   POST /api/admin/batching    # build multi-stop routes
0   6 * * *   GET  /api/merchant/recurring # materialise standing deliveries
```

## Deployment

- **App:** Railway, Render, Fly or a VPS. Avoid platforms with an ephemeral
  filesystem unless you migrate off SQLite first — the database and uploaded
  photos are files on disk.
- **Scaling past one server:** swap `src/lib/db.ts` + `src/lib/repo.ts` for
  Postgres. Every route goes through `repo.ts`, so it's a contained change.
- **Uploads:** move `/public/uploads` and `/private-uploads` to S3/R2 before
  running more than one instance.
- Set every variable from `.env.example` in your host's environment. Never
  commit `.env`.
