import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

/**
 * Real, working, zero-config database using Node's built-in SQLite module
 * (node:sqlite, Node 22+, no external binary download, no DB server to
 * install). This is what actually runs the app end-to-end right now —
 * every API route and page reads/writes here for real.
 *
 * Upgrade path: when order volume grows past what a single SQLite file
 * comfortably handles, swap this file + src/lib/repo.ts for a Postgres
 * connection (e.g. via `pg` or Prisma) — every route calls the repo
 * functions below, not this file directly, so that's a contained change.
 */

// Next.js's build-time "collecting page data" step imports every API route
// module in several parallel worker PROCESSES (not threads), each of which
// would otherwise open this same on-disk file and race to run the schema
// migrations below. A busy_timeout only smooths over lock *wait* time — on
// some build filesystems (overlay/network mounts, like Railway's builder)
// SQLite's WAL shared-memory locking doesn't behave the same as on a normal
// disk, so workers can still collide with "database is locked" no matter
// how long the timeout is. The real fix is to not touch the real file
// during the build at all: each build worker gets its own private
// in-memory database instead, so there is nothing to lock or race on.
// Building doesn't execute any route handlers, so this is never observed —
// it only has to make `import`-time initialization succeed.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const dbPath = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "swiftdrop.db");
if (!isBuildPhase) fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const globalForDb = globalThis as unknown as { __swiftdropDb?: DatabaseSync };

export const db = globalForDb.__swiftdropDb ?? new DatabaseSync(isBuildPhase ? ":memory:" : dbPath);
if (process.env.NODE_ENV !== "production") globalForDb.__swiftdropDb = db;

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
// Belt-and-suspenders: still useful for real concurrent runtime requests
// (multiple requests hitting the same connection), even though it's no
// longer what protects the build.
db.exec("PRAGMA busy_timeout = 5000;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('MERCHANT','COURIER','ADMIN','CUSTOMER')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS merchant_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  business_name TEXT NOT NULL,
  kyb_status TEXT NOT NULL DEFAULT 'pending',
  payout_method TEXT,
  shopify_domain TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS courier_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('BIKE','SCOOTER','CAR','VAN')),
  license_number TEXT,
  insurance_doc_url TEXT,
  background_check_status TEXT NOT NULL DEFAULT 'pending',
  tier TEXT NOT NULL DEFAULT 'STARTER',
  rating REAL NOT NULL DEFAULT 5.0,
  payout_account_id TEXT,
  is_online INTEGER NOT NULL DEFAULT 0,
  last_lat REAL,
  last_lng REAL,
  last_location_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  permissions TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS zones (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  name TEXT NOT NULL,
  base_rate_cents INTEGER NOT NULL,
  per_km_cents INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchant_profiles(id),
  courier_id TEXT REFERENCES courier_profiles(id),
  zone_id TEXT REFERENCES zones(id),
  pickup_address TEXT NOT NULL,
  pickup_lat REAL,
  pickup_lng REAL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat REAL,
  dropoff_lng REAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  delivery_instructions TEXT,
  package_weight_kg REAL,
  service_type TEXT NOT NULL DEFAULT 'SAME_DAY',
  status TEXT NOT NULL DEFAULT 'PENDING',
  price_cents INTEGER NOT NULL,
  courier_fee_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  proof_of_delivery_url TEXT,
  customer_rating INTEGER,
  customer_comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_at TEXT,
  picked_up_at TEXT,
  delivered_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  type TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tax_doc_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL,   -- 'courier' | 'merchant'
  owner_id TEXT NOT NULL,
  doc_type TEXT NOT NULL,     -- 'drivers_license' | 'insurance' | 'vehicle_registration' | 'business_licence' | 'void_cheque'
  url TEXT NOT NULL,
  original_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | rejected
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_type, owner_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_log(target_type, target_id);

CREATE TABLE IF NOT EXISTS courier_location_pings (
  id TEXT PRIMARY KEY,
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  order_id TEXT REFERENCES orders(id),
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pings_courier ON courier_location_pings(courier_id, created_at);

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  raised_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

/**
 * Lightweight migrations. SQLite has no "ADD COLUMN IF NOT EXISTS", so we
 * check PRAGMA table_info first. This lets an existing database upgrade in
 * place as new features land, instead of forcing a wipe.
 */
function ensureColumn(table: string, column: string, definition: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (cols.some((c) => c.name === column)) return;
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (e: any) {
    // Next.js's build-time page-data collection imports this module from
    // several worker processes in parallel, each running these migrations
    // against the same file. Two workers can both see the column missing
    // and both attempt to add it — the loser hits "duplicate column name",
    // which is harmless here (the column exists either way) and safe to
    // swallow. Any other error still throws.
    if (!/duplicate column name/i.test(String(e?.message ?? e))) throw e;
  }
}

// --- Step 1: onboarding & account states ---
ensureColumn("users", "full_name", "TEXT");
ensureColumn("users", "status", "TEXT NOT NULL DEFAULT 'active'"); // active | suspended
ensureColumn("users", "locale", "TEXT NOT NULL DEFAULT 'en'");

/**
 * The `users.role` CHECK constraint was originally MERCHANT/COURIER/ADMIN
 * only. SQLite can't ALTER a CHECK constraint in place, so an existing
 * deployed database (with real rows already in it) needs the table rebuilt
 * — rename, recreate with the wider constraint, copy every row back, drop
 * the old one. Foreign keys are other tables referencing *this table's
 * name*, not its rowid, so they keep working once `users` exists again
 * under the same name. A brand-new database never hits this: the
 * CREATE TABLE above already allows CUSTOMER, so `sql` already contains it
 * and this is a no-op.
 */
function ensureCustomerRoleSupported() {
  const row = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'`)
    .get() as { sql?: string } | undefined;
  if (!row?.sql || row.sql.includes("'CUSTOMER'")) return;

  db.exec("PRAGMA foreign_keys = OFF;");
  db.exec(`
    ALTER TABLE users RENAME TO users_role_migration_old;
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('MERCHANT','COURIER','ADMIN','CUSTOMER')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      full_name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      locale TEXT NOT NULL DEFAULT 'en'
    );
    INSERT INTO users (id, email, phone, password_hash, role, created_at, updated_at, full_name, status, locale)
      SELECT id, email, phone, password_hash, role, created_at, updated_at, full_name, status, locale
      FROM users_role_migration_old;
    DROP TABLE users_role_migration_old;
  `);
  db.exec("PRAGMA foreign_keys = ON;");
}
ensureCustomerRoleSupported();

ensureColumn("merchant_profiles", "contact_name", "TEXT");
ensureColumn("merchant_profiles", "business_phone", "TEXT");
ensureColumn("merchant_profiles", "business_address", "TEXT");
ensureColumn("merchant_profiles", "business_number", "TEXT"); // CRA business number
ensureColumn("merchant_profiles", "website", "TEXT");
ensureColumn("merchant_profiles", "kyb_notes", "TEXT");
ensureColumn("merchant_profiles", "reviewed_at", "TEXT");
ensureColumn("merchant_profiles", "reviewed_by", "TEXT");

ensureColumn("courier_profiles", "full_name", "TEXT");
ensureColumn("courier_profiles", "phone", "TEXT");
ensureColumn("courier_profiles", "license_expiry", "TEXT");
ensureColumn("courier_profiles", "insurance_provider", "TEXT");
ensureColumn("courier_profiles", "insurance_policy_number", "TEXT");
ensureColumn("courier_profiles", "insurance_expiry", "TEXT");
ensureColumn("courier_profiles", "license_doc_url", "TEXT");
ensureColumn("courier_profiles", "vehicle_make_model", "TEXT");
ensureColumn("courier_profiles", "vehicle_plate", "TEXT");
ensureColumn("courier_profiles", "approval_status", "TEXT NOT NULL DEFAULT 'pending'"); // pending | approved | rejected | suspended
ensureColumn("courier_profiles", "approval_notes", "TEXT");
ensureColumn("courier_profiles", "reviewed_at", "TEXT");
ensureColumn("courier_profiles", "reviewed_by", "TEXT");

// --- Step 2: scheduling, routing and dispatch ---
ensureColumn("orders", "window_start", "TEXT"); // ISO datetime — earliest delivery
ensureColumn("orders", "window_end", "TEXT"); // ISO datetime — latest delivery (promise)
ensureColumn("orders", "distance_km", "REAL");
ensureColumn("orders", "distance_source", "TEXT"); // 'osrm' | 'estimate'
ensureColumn("orders", "eta_minutes", "REAL");
ensureColumn("orders", "dispatch_mode", "TEXT NOT NULL DEFAULT 'auto'"); // auto | broadcast | manual
ensureColumn("orders", "failure_reason", "TEXT");
ensureColumn("orders", "returned_at", "TEXT");

// --- Step 3: notifications, chat and two-way ratings ---
ensureColumn("orders", "arrived_at_pickup", "TEXT");
ensureColumn("orders", "merchant_rating", "INTEGER"); // courier rates the merchant
ensureColumn("orders", "merchant_rating_comment", "TEXT");
ensureColumn("merchant_profiles", "rating", "REAL NOT NULL DEFAULT 5.0");

// --- Step 4: batching, surge, API keys, recurring, challenges ---
ensureColumn("orders", "batch_id", "TEXT");
ensureColumn("orders", "batch_sequence", "INTEGER");
ensureColumn("orders", "surge_multiplier", "REAL NOT NULL DEFAULT 1.0");
ensureColumn("orders", "source", "TEXT NOT NULL DEFAULT 'portal'"); // portal | csv | api | recurring
ensureColumn("zones", "surge_multiplier", "REAL NOT NULL DEFAULT 1.0");
ensureColumn("zones", "surge_note", "TEXT");
ensureColumn("courier_profiles", "payout_balance_cents", "INTEGER NOT NULL DEFAULT 0");

// --- Step 5: compliance, trust, support ---
ensureColumn("orders", "requires_age_verification", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("orders", "age_verified_at", "TEXT");
ensureColumn("orders", "age_verification_method", "TEXT"); // id_checked | refused_underage | refused_no_id
ensureColumn("orders", "temperature_requirement", "TEXT NOT NULL DEFAULT 'ambient'"); // ambient | cold | frozen
ensureColumn("orders", "engaged_minutes", "REAL");
ensureColumn("courier_profiles", "has_insulated_bag", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("courier_profiles", "locale", "TEXT NOT NULL DEFAULT 'en'");
ensureColumn("disputes", "order_amount_cents", "INTEGER");
ensureColumn("disputes", "resolution_amount_cents", "INTEGER");
ensureColumn("disputes", "resolved_by", "TEXT");
ensureColumn("disputes", "resolved_at", "TEXT");

// --- Step 6: soft delete — admin "delete" moves a record here instead of
// erasing it, so it can be reviewed or restored from /admin/deleted-records.
// A row with deleted_at set is filtered out of every normal list query.
ensureColumn("merchant_profiles", "deleted_at", "TEXT");
ensureColumn("merchant_profiles", "deleted_by", "TEXT");
ensureColumn("courier_profiles", "deleted_at", "TEXT");
ensureColumn("courier_profiles", "deleted_by", "TEXT");
ensureColumn("orders", "deleted_at", "TEXT");
ensureColumn("orders", "deleted_by", "TEXT");

// --- Step 7: rider safety — emergency contact on file, so an SOS or a
// shared-location link has somewhere real to point.
ensureColumn("courier_profiles", "emergency_contact_name", "TEXT");
ensureColumn("courier_profiles", "emergency_contact_phone", "TEXT");

// --- Step 8: order cancellation & refunds. Cancelling only ever changes
// status + these columns — it never deletes anything, so the order stays
// fully visible in history. refund_status starts 'none' (nothing to refund,
// e.g. cancelled pre-pickup and never billed) and a cancellation can move it
// to 'pending' for ops to action from the admin refund queue.
ensureColumn("orders", "cancelled_at", "TEXT");
ensureColumn("orders", "cancelled_by", "TEXT"); // user id of whoever cancelled it
ensureColumn("orders", "cancel_reason", "TEXT");
ensureColumn("orders", "refund_status", "TEXT NOT NULL DEFAULT 'none'"); // none | pending | refunded | denied
ensureColumn("orders", "refund_amount_cents", "INTEGER");
ensureColumn("orders", "refund_note", "TEXT");
ensureColumn("orders", "refunded_at", "TEXT");

// --- Step 9: SLA breach tracking. Set once (by the dispatch tick) the first
// time an in-flight order is spotted past its promised window_end, so the
// admin/merchant push only fires once per order instead of every tick.
ensureColumn("orders", "sla_breach_alerted_at", "TEXT");

db.exec(`
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  opened_by_role TEXT NOT NULL,        -- merchant | courier | customer | admin
  opened_by_user_id TEXT,
  contact_email TEXT,
  order_id TEXT REFERENCES orders(id),
  category TEXT NOT NULL,              -- delivery | payment | account | app | other
  subject TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open', -- open | pending | resolved | closed
  assigned_to TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status, created_at);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id),
  sender_role TEXT NOT NULL,
  sender_user_id TEXT,
  body TEXT NOT NULL,
  internal INTEGER NOT NULL DEFAULT 0,  -- internal notes aren't shown to the requester
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages ON ticket_messages(ticket_id, created_at);

CREATE TABLE IF NOT EXISTS fraud_flags (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,          -- courier | merchant | order
  subject_id TEXT NOT NULL,
  order_id TEXT,
  rule TEXT NOT NULL,                  -- impossible_speed | duplicate_pod | excessive_cancels | instant_delivery
  severity TEXT NOT NULL DEFAULT 'medium',
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open | reviewed | dismissed
  reviewed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fraud_status ON fraud_flags(status, created_at);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  courier_id TEXT REFERENCES courier_profiles(id),
  zone_id TEXT REFERENCES zones(id),
  status TEXT NOT NULL DEFAULT 'open',   -- open | offered | assigned | completed
  stop_count INTEGER NOT NULL DEFAULT 0,
  total_km REAL,
  total_courier_fee_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchant_profiles(id),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  webhook_url TEXT,
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_apikeys_merchant ON api_keys(merchant_id);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  order_id TEXT,
  event TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  response_code INTEGER,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recurring_orders (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchant_profiles(id),
  zone_id TEXT NOT NULL REFERENCES zones(id),
  label TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat REAL, pickup_lng REAL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat REAL, dropoff_lng REAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  delivery_instructions TEXT,
  service_type TEXT NOT NULL DEFAULT 'SAME_DAY',
  days_of_week TEXT NOT NULL,            -- e.g. "1,3,5" (0=Sun)
  window_hour_start INTEGER,
  window_hour_end INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  last_generated_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_recurring_merchant ON recurring_orders(merchant_id, active);

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_deliveries INTEGER NOT NULL,
  bonus_cents INTEGER NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  min_tier TEXT NOT NULL DEFAULT 'STARTER',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS challenge_claims (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  bonus_cents INTEGER NOT NULL,
  claimed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_claim_unique ON challenge_claims(challenge_id, courier_id);

CREATE TABLE IF NOT EXISTS payout_requests (
  id TEXT PRIMARY KEY,
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL DEFAULT 0,
  method TEXT NOT NULL,                   -- instant | weekly
  status TEXT NOT NULL DEFAULT 'requested', -- requested | approved | paid | rejected
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_payout_courier ON payout_requests(courier_id, status);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  channel TEXT NOT NULL,            -- sms | email
  recipient TEXT NOT NULL,
  template TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL,             -- sent | logged | failed
  provider TEXT,                    -- twilio | resend | console
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications(order_id);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  sender_role TEXT NOT NULL,        -- customer | courier | merchant | admin
  sender_user_id TEXT,              -- null for the customer (no account)
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_order ON messages(order_id, created_at);

CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  status TEXT NOT NULL DEFAULT 'offered', -- offered | accepted | declined | expired
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  responded_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_offers_order ON offers(order_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_courier ON offers(courier_id, status);

-- Web push subscriptions. subject_type/subject_id is either a signed-in
-- account ("user", the user's id — driver/merchant/admin) or a guest
-- customer's own delivery ("order", the order id — there's no customer
-- account to key it to, so the tracking page itself is the subject).
-- endpoint is unique per browser+device, so re-subscribing (e.g. after
-- permission was re-granted) just updates the existing row.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,   -- user | order
  subject_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_push_subject ON push_subscriptions(subject_type, subject_id);

-- Customer accounts & loyalty. A CUSTOMER user is still matched to their
-- past guest orders by email/phone (orders have no customer_user_id — see
-- the note on the orders table), so an address book and loyalty balance is
-- everything an account actually needs to add on top of that.
CREATE TABLE IF NOT EXISTS customer_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  label TEXT NOT NULL DEFAULT 'Home',
  address TEXT NOT NULL,
  lat REAL,
  lng REAL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON customer_addresses(user_id);

CREATE TABLE IF NOT EXISTS loyalty_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  points INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  order_id TEXT REFERENCES orders(id),
  points INTEGER NOT NULL,       -- positive = earned, negative = redeemed
  reason TEXT NOT NULL,          -- order_delivered | referral_bonus | referred_signup_bonus | redeemed
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user ON loyalty_transactions(user_id, created_at);

-- Smart incentives: when a zone's pending-order count crosses a threshold,
-- the dispatch tick (lib/dispatch.ts) auto-creates one of these and pushes
-- every online courier — nobody has to notice the queue building up and
-- manually spin up a bonus. One open alert per zone at a time; it expires
-- on its own (short-lived, matches how fast demand spikes actually move).
CREATE TABLE IF NOT EXISTS surge_alerts (
  id TEXT PRIMARY KEY,
  zone_id TEXT NOT NULL REFERENCES zones(id),
  waiting_count INTEGER NOT NULL,
  bonus_cents INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_surge_alerts_zone ON surge_alerts(zone_id, expires_at);

-- Rider safety: an SOS press creates one of these -- courier_id and a best-
-- effort last known position, order_id when they were mid-delivery. Kept
-- separate from the disputes table (which is always order-scoped and
-- billing-flavoured) because a safety event can happen with no order at all.
CREATE TABLE IF NOT EXISTS safety_incidents (
  id TEXT PRIMARY KEY,
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  order_id TEXT REFERENCES orders(id),
  lat REAL,
  lng REAL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'open',   -- open | acknowledged | resolved
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_status ON safety_incidents(status, created_at);

-- A short-lived, unauthenticated "share my location" link — the courier
-- generates one and texts it to whoever they want watching over them; no
-- account needed to view it, same trust model as the customer tracking
-- link. Expires on its own.
CREATE TABLE IF NOT EXISTS location_shares (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_location_shares_token ON location_shares(token);

-- Per-role read state for an order's chat thread — up to four roles
-- (customer/courier/merchant/admin) share one thread, so "seen" is tracked
-- per role rather than per message.
CREATE TABLE IF NOT EXISTS message_read_state (
  order_id TEXT NOT NULL REFERENCES orders(id),
  role TEXT NOT NULL,
  last_read_at TEXT NOT NULL,
  PRIMARY KEY (order_id, role)
);
`);
