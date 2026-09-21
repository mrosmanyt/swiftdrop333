# SwiftDrop — Local Delivery Platform Blueprint
### A Trexity-style, 4-sided delivery ecosystem for Canada (Merchant · Driver · Customer · Admin)

*Working name "SwiftDrop" used as a placeholder — swap it once you pick a real brand/domain.*
*Prepared: September 2026*

---

## 1. Executive Summary

You want to build a same-city, same-day/next-day local delivery platform for the Canadian market — the same category as **Trexity** (Ottawa-based, operating in 8+ Canadian cities, 15,000+ couriers, 3,000+ merchants, ~4,000 deliveries/day) — but architected to be more efficient, fairer to couriers, and cheaper to operate than the incumbent.

The platform has **four interconnected systems** sharing one backend and one order/data model:

1. **Merchant Portal** (web) — local shops sign up, plug into their store checkout, create/manage delivery orders.
2. **Driver App** (mobile-first web → native app later) — gig couriers accept delivery offers, navigate, get paid, level up through a fair tier system.
3. **Customer Experience** (no-login tracking page + optional app) — real-time tracking, photo-proof of delivery, ETA, ratings.
4. **Admin/Ops Dashboard** (internal, web) — SwiftDrop's own team manages merchants, couriers, pricing zones, disputes, payouts, and system health.

All four talk to one **Order & Dispatch Engine** — the real "product" — which is where your efficiency edge over Trexity actually gets built (smarter batching, dynamic pricing, better courier-matching, fewer failed deliveries).

**Build order recommended:** Website first (Merchant Portal + Admin, since these run your business), then Driver web-app (mobile-responsive, installable as a PWA — no app store needed yet), then Customer tracking page, then native mobile apps once you have real order volume to justify app-store investment.

---

## 2. What Trexity Actually Does (competitive research, so we build the right thing)

| Area | Trexity's model |
|---|---|
| **Core pitch to merchants** | "We take the last-mile off your plate" — local courier network, real-time tracking, pricing that scales with volume. No commission on merchant's sales (unlike Uber Eats/DoorDash's ~30% commission model). |
| **Delivery tiers offered** | Next Day (flat-rate, non-perishables), Same Day (flat-rate zones — retail/pharmacy/gifts), Direct (on-demand, exclusive courier, no shared route — florists/bakeries/VIP), Batch (high-density multi-stop routes for high-volume merchants — best rate). |
| **Merchant integration** | One-click shipping option inside checkout (deep Shopify integration is their main growth channel). Sign-up takes minutes. |
| **Courier model** | 100% independent contractors (gig), app-based offer/accept system, choose your own hours, vehicle must fit sub-20lb packages (no hot food, no hazmat, no live animals). |
| **Courier pay** | Per-delivery + "challenges" (bonus incentives). Trexity keeps ~30% of the delivery fee, courier keeps the rest — better split than food-delivery apps. |
| **Courier gamification** | "Courier+ Program" — performance tiers based on completion rate, acceptance rate, misdeliveries, suspensions, complaints, and delivery volume (14-day + lifetime counters). Top tier = **Trexity Pro**: +$0.15/delivery, exclusive challenges, priority batch-route access, priority access to delivery drops. |
| **Customer experience** | Real-time tracking reduces "where is my order" support tickets. New **"Trexity GO"** app (2026) extends this to consumers directly — no account needed, pay-per-delivery, photo confirmation, positioned partly as an alternative when Canada Post has disruptions. |
| **Pricing philosophy** | ~90% cheaper than traditional couriers/carriers for small businesses; flat/zone-based, not commission-based. |
| **Coverage** | Same-city only, 8 Canadian + 13+ US cities. |
| **Company stance** | Deliberately stays "behind the scenes" — merchant keeps their own branding; Trexity is the invisible logistics layer. |

**Where the gaps are (your opportunity):**

- Courier tier system is opaque and slow to reward — couriers don't know in real time how close they are to leveling up.
- No AI-driven route/batch optimization mentioned — batching appears rule-based, not ML-optimized. This is the single biggest cost lever in last-mile delivery.
- No transparent, real-time "surge"/dynamic pricing for merchants during high-demand windows (weather, holidays) — an opportunity to both increase courier supply *and* fairly price merchants.
- No visible multi-modal fallback (bike couriers for dense downtown cores = cheaper + faster than car in congested cities like Toronto/Vancouver).
- Consumer app (Trexity GO) is brand-new — a well-built customer-first experience is still a wide-open lane.
- No stated loyalty/repeat-customer layer for merchants' own end customers (a review/rating + repeat-order nudge system could be a merchant retention tool Trexity doesn't emphasize).

---

## 3. System Architecture — How the Four Systems Connect

```
                        ┌─────────────────────────────┐
                        │      ADMIN DASHBOARD          │
                        │ (zones, pricing, payouts,     │
                        │  disputes, fraud, analytics)  │
                        └───────────────┬────────────────┘
                                        │ manages/overrides
                                        ▼
   ┌───────────────┐   creates order   ┌─────────────────────────┐   assigns   ┌───────────────┐
   │   MERCHANT     │ ─────────────────▶│   ORDER & DISPATCH       │─────────────▶│    DRIVER     │
   │   PORTAL       │                   │   ENGINE (core backend)  │              │     APP       │
   │ (web + API/    │◀───status webhook─│  - order lifecycle       │◀──accept/────│  (PWA→native) │
   │  Shopify plugin)│                  │  - pricing engine        │   update GPS │               │
   └───────────────┘                   │  - batching/routing       │              └───────┬───────┘
                                        │  - courier matching       │                      │ live GPS,
                                        │  - notifications           │                      │ POD photo
                                        └───────────┬───────────────┘                      │
                                                     │ tracking link + push                 │
                                                     ▼                                      │
                                        ┌─────────────────────────┐                        │
                                        │   CUSTOMER EXPERIENCE     │◀───────────────────────┘
                                        │ (no-login tracking page,  │
                                        │  rating, POD photo view)  │
                                        └─────────────────────────┘
```

**One shared database, one API, four front-ends.** This is the key efficiency decision: instead of four separate apps with duplicated logic, you build **one backend (REST/GraphQL API + WebSocket layer for live tracking)** and four thin clients. This is exactly how Trexity-scale platforms stay maintainable with a small engineering team — and it's the #1 mistake inefficient clones make (building four disconnected systems that don't share state cleanly).

---

## 4. System 1 — Merchant Portal

**Who uses it:** small/medium local businesses (retail, pharmacy, florist, bakery, restaurant-adjacent non-food retail).

**Core features (MVP):**
- Sign-up/KYB (business verification, payment method on file)
- Create a delivery order manually (pickup address, drop-off address, package size/weight, delivery type: Same Day / Next Day / Direct / Batch)
- **Shopify / WooCommerce / generic API plugin** — auto-create delivery order at checkout (this is Trexity's #1 growth channel; copy it, don't skip it)
- Live map tracking of their own outgoing orders
- Delivery history, invoicing, CSV export
- Rate card visible upfront (transparent zone-based pricing, not a black box)
- Bulk upload for batch/multi-stop orders (CSV or API)
- Webhooks back to merchant's own system (order picked up / delivered / failed)
- Support chat/ticket

**Phase 2 additions:** volume-based pricing tiers auto-applied, scheduled recurring deliveries, multi-location support for chains, branded tracking page (merchant's logo on the tracking link — Trexity stays invisible, you can let merchants **optionally** co-brand to increase their loyalty to your platform).

---

## 5. System 2 — Driver (Courier) App

**Who uses it:** independent contractor couriers (car, bike, scooter — multi-modal from day one is your efficiency edge in dense cores).

**Core features (MVP):**
- Onboarding: ID verification, driver's license, vehicle info + insurance upload, background check integration (e.g. Certn — a Canadian background-check provider used by many gig platforms)
- Availability toggle (go online/offline)
- **Offer screen**: incoming delivery/batch offers with pay shown upfront, accept/decline, countdown timer
- Turn-by-turn navigation handoff (deep-link to Google/Apple Maps, or embedded map)
- Proof of delivery: photo + optional signature + GPS-stamped drop location
- Real-time earnings dashboard (today/week/lifetime)
- **Tier & gamification system — built to be more transparent and motivating than Trexity's:**

  | Tier | Requirements (rolling 14-day window) | Perks |
  |---|---|---|
  | Starter | New courier | Standard offers |
  | Silver | ≥95% completion rate, ≥50 deliveries/14d | Slightly earlier offer visibility |
  | Gold | ≥97% completion rate, ≥120 deliveries/14d, 0 misdeliveries | Priority batch routes, +$0.10/delivery |
  | **Pro** | ≥98% completion rate, 0 complaints/suspensions, ≥200 deliveries/14d | +$0.20/delivery (beat Trexity's $0.15), first access to delivery drops, priority support line, weekly bonus challenges |

  **Efficiency improvement over Trexity:** show couriers a **live progress bar** toward the next tier ("3 more deliveries this week to reach Gold") instead of a static end-of-period reveal — this is a proven gig-economy retention lever and costs nothing extra to build since you already track the same counters.
- In-app instant/weekly payout options (Stripe Connect supports both in Canada)
- Weekly automated tax summary (T4A / self-employed earnings statement) — a genuine differentiator, since most gig platforms leave couriers to sort out their own bookkeeping.

**Phase 2:** multi-stop batch acceptance with optimized route order (not just a list — actual sequencing), heat-map of high-demand zones/times, referral bonuses, native iOS/Android app once PWA proves demand.

---

## 6. System 3 — Customer Experience

**Who uses it:** the end customer receiving the package (the merchant's customer, or — if you later launch a "SwiftDrop GO" consumer product like Trexity GO — a direct sender).

**Core features (MVP):**
- **No account required** to track a delivery — just a link (SMS/email) — copy Trexity GO's low-friction approach
- Live map + ETA
- Delivery status timeline (Order placed → Picked up → In transit → Delivered)
- Photo proof of delivery visible to customer
- Post-delivery rating (1–5 stars + optional comment) — feeds both courier QA and merchant feedback
- Delivery instructions field (gate code, "leave at side door," etc.) visible to courier

**Phase 2 (your "SwiftDrop GO" consumer play, once merchant side is proven):** a standalone consumer-facing app for peer-to-peer/errand-style local delivery — same backend, new front-end, direct competitor to Trexity GO and a genuine second revenue line.

---

## 7. System 4 — Admin / Ops Dashboard

**Who uses it:** your internal team (you, dispatch/support staff, finance).

**Core features (MVP):**
- Merchant management: approve/suspend accounts, view volume, adjust custom pricing
- Courier management: approve applications, view performance/tier, suspend for cause, manage payouts
- **Zone & pricing engine**: define delivery zones per city, set flat-rate/zone pricing, adjust dynamically for demand (surge windows)
- Live ops map: every active delivery in every city, at a glance
- Dispute resolution queue (failed/late/damaged delivery claims)
- Financial reporting: revenue, courier payout liability, take-rate by zone/merchant
- Manual dispatch override (reassign a stuck order to another courier)
- Fraud/abuse flags (GPS spoofing detection, fake delivery photos, excessive cancellations)

**Phase 2:** automated anomaly detection (ML flag on delivery-time outliers), city-by-city expansion playbook dashboard, courier supply/demand forecasting.

---

## 8. Shared Backend — Data Model (core entities)

```
User (base) ──┬── MerchantProfile (business_name, KYB_status, payout_method, integrations)
              ├── CourierProfile (vehicle_type, license, insurance, tier, rating, payout_method)
              ├── AdminProfile (role, permissions)
              └── CustomerContact (phone/email only — no account required)

Order
  id, merchant_id, pickup_address, dropoff_address, package_details,
  service_type [next_day|same_day|direct|batch], status, price, courier_fee,
  platform_fee, assigned_courier_id, created_at, picked_up_at, delivered_at,
  proof_of_delivery_url, customer_rating, zone_id

Batch (groups multiple Orders assigned to one courier route)
Zone (city, polygon boundary, base_rate_table)
Payout (courier_id, period, amount, status, tax_doc_url)
Dispute (order_id, raised_by, reason, status, resolution)
Event/AuditLog (every state change, for support + fraud review)
```

Real-time layer: WebSocket (or managed service like Pusher/Ably) pushes courier GPS + status updates to both the Driver app and the Customer tracking page simultaneously — this is what makes "real-time tracking" actually real-time instead of polling every 30 seconds (which is what a lot of clones do and it feels laggy).

---

## 9. Recommended Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend (Merchant + Admin + Customer tracking) | **Next.js (React) + TypeScript**, Tailwind CSS | One framework for all three web front-ends, SSR for fast public tracking pages, huge hiring pool |
| Driver app | **Next.js PWA** first (installable, works on any phone, no app-store delay) → **React Native** later for native iOS/Android once volume justifies it | Fastest path to a real, testable product; code/logic reused from web |
| Backend API | **Node.js (NestJS or Express) + TypeScript** | Same language as frontend = one team can own the whole stack |
| Database | **PostgreSQL** (with PostGIS extension for geo-queries — zones, distance calc, nearest-courier matching) | Battle-tested, geo-native, works great with Prisma ORM |
| Real-time | **WebSockets via Socket.IO**, or managed **Pusher**/**Ably** for v1 to move faster | Live GPS + status push without building your own infra first |
| Maps/Routing | **Google Maps Platform** (Directions, Distance Matrix, Geocoding) or **Mapbox** (often cheaper at scale) | Canada-wide coverage, batch route optimization APIs available |
| Payments/Payouts | **Stripe** (Stripe Connect for courier payouts, Stripe Billing for merchant invoicing) | Handles Canadian tax forms, instant payouts, PCI compliance out of the box |
| Auth | **Auth.js (NextAuth)** or **Clerk** | Fast to implement, supports role-based access for 4 user types |
| Hosting | **Vercel** (frontends) + **Railway/Render/AWS** (backend + Postgres) | Low ops overhead for a small team, scales up smoothly |
| Background jobs (payouts, batch optimization runs, notifications) | **BullMQ + Redis** | Standard Node.js job queue |
| Notifications | **Twilio** (SMS tracking links) + **Resend/SendGrid** (email) | Canadian SMS delivery well-supported |
| Background checks | **Certn** (Canadian provider) | Purpose-built for Canadian gig-worker screening |
| Monitoring | **Sentry** + **Better Uptime** | Catch failed deliveries caused by bugs before customers do |

This stack lets **one full-stack team of 2-4 developers** build and run all four systems, because it's genuinely one codebase (a monorepo with shared types) rather than four separate projects — which is the concrete "more efficient" answer to your brief.

---

## 10. Canada-Specific Compliance (do not skip — this is where clones get into trouble)

- **Gig worker classification**: Ontario's *Digital Platform Workers' Rights Act (2022)* — and similar emerging provincial rules — require minimum wage guarantees for time actively working, transparent pay structure disclosure, and dispute processes for digital platform workers in Ontario. If you operate there, your courier agreement and pay-transparency screens need to reflect this from day one, not bolted on later.
- **Privacy**: PIPEDA (federal) governs how you handle customer/courier personal data (GPS trails, ID documents, photos) — build data-retention limits and consent flows in from the start.
- **GST/HST**: as the platform operator you'll charge/remit tax on your platform fee; couriers as independent contractors are generally responsible for their own HST registration once they cross the small-supplier threshold (~$30k/year) — worth flagging clearly in courier onboarding, and ideally your payout summaries help them track this.
- **Insurance**: courier's personal auto insurance typically does **not** cover commercial delivery use by default in most Canadian provinces — either require proof of commercial/rideshare-endorsement insurance at onboarding, or partner with a provider offering pay-per-delivery contingent liability coverage (several exist for gig platforms).
- **Provincial incorporation vs. federal**: for the company itself, decide federal incorporation (operate under one name across provinces) vs. provincial (e.g., Ontario) — federal is usually the right call if you plan multi-city expansion, as Trexity has done.

---

## 11. Differentiation Strategy — Concretely "More Efficient Than Trexity"

1. **ML-assisted batch routing from day one** (even a simple nearest-neighbor + 2-opt route optimizer beats naive sequential assignment) — this alone can cut courier idle-time/km per delivery by 15-25%, which is the single biggest lever on both courier earnings *and* your margin.
2. **Real-time tier progress** for couriers (not just end-of-period tier reveal) — proven to improve retention and acceptance rates in gig platforms.
3. **Transparent, published zone-rate card** for merchants (Trexity doesn't publish rates publicly) — removes a sales-friction step and builds trust faster in a market where merchants are wary of hidden fees.
4. **Multi-modal fleet** (bike couriers in dense downtown zones like Toronto/Vancouver/Montreal cores) — cheaper per-delivery cost and often *faster* than cars in congested traffic + easier parking for the courier.
5. **Slightly better courier take-rate than Trexity's ~70/30 split**, funded by the routing efficiency gains above rather than by cutting margin — i.e., you make the pie bigger with better routing instead of just paying couriers more from a smaller pie.
6. **Merchant-side loyalty layer**: post-delivery review + "reorder" nudge sent to the *merchant's customer* — a retention tool for your merchants that Trexity doesn't emphasize, making your platform stickier for the business, not just cheaper.
7. **Weekly automated courier tax/earnings statements** — a small build cost that meaningfully improves courier trust and reduces support load come tax season.

---

## 12. MVP Roadmap

**Phase 0 (Weeks 1-2): Foundation**
- Finalize brand name/domain, incorporate business, set up Stripe/Twilio/Maps accounts
- Set up monorepo, CI/CD, staging environment
- Design core data model + API contracts (shared across all 4 systems)

**Phase 1 (Weeks 3-8): Website — Merchant Portal + Admin Dashboard**
- Merchant sign-up/KYB, manual order creation, basic tracking page (customer-facing, no login)
- Admin: merchant approval, manual order/zone management, basic reporting
- One pricing zone live in one city (pick your home city to pilot)
- **This is the version you can start onboarding your first 5-10 real merchants with.**

**Phase 2 (Weeks 9-14): Driver App (PWA) + Dispatch Engine**
- Courier onboarding + background check integration
- Offer/accept flow, GPS tracking, proof of delivery
- Basic batching (rule-based first, ML-assisted routing as fast-follow)
- Stripe Connect payouts live
- Tier/gamification system v1

**Phase 3 (Weeks 15-18): Polish + Shopify Integration**
- Shopify app listing (this is Trexity's proven growth channel — don't skip it)
- Customer rating/review loop
- Zone expansion tooling in admin (so launching city #2 is a config change, not a rebuild)

**Phase 4 (Month 5+): Scale**
- Native mobile apps (React Native) for Driver + optional Customer app
- ML route optimization v2
- Second city launch
- "SwiftDrop GO" consumer product (your answer to Trexity GO)

---

## 13. Monetization Model

- **Per-delivery fee** charged to merchant (zone/flat-rate based, transparent rate card) — same proven model as Trexity, not a commission-on-sales model (which is what makes this attractive to small merchants over Uber Eats/DoorDash-style platforms)
- Platform keeps a target **25-30% of the delivery fee**, courier keeps the rest (competitive with or better than Trexity's split, funded by routing efficiency rather than thinner courier pay)
- Optional **merchant subscription tier** later (volume discounts, priority dispatch, branded tracking pages) — recurring revenue layer Trexity doesn't clearly emphasize
- Phase 4: **consumer pay-per-delivery** revenue via the "SwiftDrop GO" product

---

## 14. Success Metrics (KPIs to track from day one in the Admin dashboard)

- Delivery completion rate (target ≥97%)
- Average delivery time vs. promised ETA
- Courier acceptance rate (offer → accept)
- Cost per delivery (courier pay + platform overhead) — your key efficiency metric vs. Trexity
- Merchant retention / repeat-order rate
- Customer satisfaction rating (post-delivery)
- Courier retention rate by tier (are Pro couriers actually staying?)

---

## 15. Immediate Next Steps

1. Confirm this blueprint covers what you had in mind — flag anything to change before code starts.
2. Pick a real brand name + domain (I used "SwiftDrop" as a placeholder throughout).
3. I'll scaffold the actual website codebase now (Next.js + Node/Postgres monorepo, with skeleton pages/auth for all 4 roles) into your connected `D:\canada project` folder so you have real, running code to build on — not just this document.
4. Decide pilot city (recommend wherever you have the most existing merchant relationships/contacts, to make first-customer acquisition easier).
