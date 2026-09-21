# SwiftDrop — Local Delivery Platform (real, working backend)

Goes with `SwiftDrop-Platform-Blueprint.md`. This is not a mockup — it's a
**real Next.js app with a real embedded database**, and every one of the
four roles (Merchant, Driver, Customer, Admin) runs the actual system end
to end through the website: create a delivery, accept it, watch the
courier move on a live map, deliver it with a photo, rate it. All of it
was tested and verified working in this build (order creation → accept →
live GPS ping → pickup → photo upload → delivery → customer rating →
courier rating roll-up → admin live map) — see "What's real" below.

## What's real right now (not a TODO — actually works)

- **Real database.** Uses Node's built-in SQLite (`node:sqlite`, Node
  22+) — zero setup, no server to install, no external binary download.
  The database file is created automatically on first run.
- **Real auth**, role-based (NextAuth + bcrypt password hashing). Merchant,
  Driver, and Admin each get their own signed-in area; the middleware
  blocks `/merchant`, `/driver`, `/admin` from the wrong role.
- **Real order lifecycle**: Merchant creates a delivery → it appears as a
  live offer to couriers → a courier accepts (first to click wins, race
  handled server-side) → picked up → delivered (photo required, uploaded
  for real) → customer rates it → the courier's average rating updates.
- **Live GPS tracking — the big one you asked for.** While a courier is
  "Online" (toggle in the Driver app), the browser's Geolocation API
  streams their position to the server every ~5s. That live position is
  visible, in real time, to:
  - the **customer** on the no-login tracking page (`/track/<order-id>`),
    with a live map and an ETA estimate;
  - the **merchant**, on that order's detail page (`/merchant/orders/<id>`);
  - **admin**, on a dedicated Live Ops Map (`/admin/live-map`) showing
    every courier currently on a delivery, all at once.
  All three poll every 4-6 seconds — no separate WebSocket server needed,
  and it's genuinely live.
- **Real maps, no API key.** The live map uses Leaflet + free
  OpenStreetMap tiles — nothing to sign up for, nothing to pay for, works
  immediately.
- **Real pricing engine**: zone-based flat rate + per-km + service-type
  multiplier, computed from actual pickup/dropoff coordinates.
- **Real courier tier system**: Starter/Silver/Gold/Pro, computed from
  actual delivery counts and completion rate over a rolling 14-day
  window, with live progress shown on the Earnings page.
- **Admin dashboards** with real, auto-refreshing counts (merchants,
  couriers, online-now, orders by status) and a zone/pricing editor that
  actually writes to the database.

## What's still a placeholder (intentionally, for later)

- **Payments/payouts** (Stripe Connect) — not wired in; couriers/merchants
  aren't charged yet.
- **SMS/email notifications** (Twilio/Resend) — the tracking link isn't
  auto-texted to the customer yet; you copy it from the merchant's order
  list for now.
- **Address autocomplete / real road distance** — pickup/dropoff lat/lng
  are optional fields today; without them pricing falls back to a flat
  3km estimate. Wiring up Google/Mapbox geocoding is the next step for
  exact addresses and accurate per-km pricing.
- **Shopify integration**, background checks (Certn) — described in the
  blueprint, not yet built.
- File uploads (proof-of-delivery photos) save to `/public/uploads` —
  fine for one server; move to S3/R2 before running multiple server
  instances.

## Getting started

### 1. Prerequisite
- **Node.js 22+** (needed for the built-in `node:sqlite` module). Check
  with `node -v`.

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Generate a real `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```
Nothing else in `.env.example` is required to run the app — Stripe, Maps,
Twilio, Certn are all placeholders for features described above.

### 4. Seed test accounts
```bash
npm run seed
```
Prints three working logins (password `password123` for all):
`merchant@example.com`, `courier@example.com`, `admin@example.com`, plus
three pricing zones (Toronto Downtown/North York, Vancouver Downtown).

To wipe and start over: `npm run db:reset`.

### 5. Run it
```bash
npm run dev
```
Visit `http://localhost:3000`.

### 6. Try the full live flow
1. Sign in as **merchant@example.com** → New delivery → fill in the form
   (zone picker is live-loaded from the database) → you land on that
   order's live tracking page.
2. Open a **second browser** (or incognito window) → sign in as
   **courier@example.com** → `/driver/offers` → click **"● Offline"** to
   go online (your browser will ask for location permission — allow it)
   → accept the offer you just created.
3. Click **"Mark picked up"**, then attach any photo and click **"Mark
   delivered"**.
4. Go back to the **merchant's** order page, or open the public
   `/track/<order-id>` link (also linked from the merchant's order list) —
   you'll see the courier's live position move on the map while the order
   is in progress, and the status timeline update within a few seconds.
5. Sign in as **admin@example.com** → `/admin/live-map` → see the same
   courier live, alongside every other in-flight delivery.

## Project structure
```
scripts/seed.ts        # test data
src/
  app/
    merchant/            # Merchant Portal (dashboard, orders, new-order form, order detail w/ live map)
    driver/               # Driver App (offers, earnings, tier progress)
    admin/                 # Admin Dashboard (overview, live map, merchants, couriers, zones)
    track/[orderId]/        # Customer tracking page (public, live map)
    api/                     # backend routes — every one guarded by role where it should be
    login/                    # shared login (role-based redirect via middleware)
  components/
    LiveMap*.tsx              # Leaflet live map (courier / pickup / dropoff markers)
    DriverLocationControl.tsx  # the "driver's location is always on" piece
    TrackingLive.tsx            # polling status + map, shared by customer & merchant views
    AdminLiveMap.tsx             # admin's all-couriers live map
    ActiveDeliveryCard.tsx        # courier's accept → pickup → photo → deliver actions
    AcceptOfferButton.tsx, RatingForm.tsx, NewZoneForm.tsx, AutoRefresh.tsx
  lib/
    db.ts                # SQLite connection + schema (real tables, real SQL)
    repo.ts               # every DB read/write goes through here — swap for Postgres later by editing this one file
    auth.ts                 # NextAuth config
    session.ts               # getSessionUser() / requireRole() helpers used by every page & API route
    pricing.ts                 # zone pricing + courier tier logic — your "more efficient than Trexity" edge
    types.ts                    # shared types, ETA/haversine helpers
  middleware.ts             # role-based route protection
```

## Deployment (when ready)
- **App**: Vercel, Railway, or any Node host. `node:sqlite` needs a
  filesystem that persists between deploys (Vercel's serverless
  filesystem is ephemeral — use Railway/Render/a VPS, or migrate to
  Postgres, for production).
- **Scaling past one server / one SQLite file**: swap `src/lib/db.ts` +
  `src/lib/repo.ts` for a Postgres connection — every route and page
  calls the functions in `repo.ts`, not the database directly, so this
  is a contained change.
- Set every variable from `.env.example` in your host's environment
  settings; never commit `.env`.

## Next build steps (see blueprint §11-12 for the full roadmap)
1. Twilio/Resend: auto-send the tracking link to the customer when an
   order is created (`src/app/api/orders/route.ts` has a `// TODO`).
2. Google/Mapbox geocoding on the "New delivery" form for real addresses
   and accurate distance-based pricing.
3. Stripe Connect payouts for couriers, Stripe Billing for merchants.
4. Move proof-of-delivery uploads from local disk to S3/R2.
5. Shopify app so merchants' checkouts create SwiftDrop orders
   automatically — this was Trexity's #1 growth channel.
