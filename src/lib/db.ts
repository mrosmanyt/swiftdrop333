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

const dbPath = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "swiftdrop.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const globalForDb = globalThis as unknown as { __swiftdropDb?: DatabaseSync };

export const db = globalForDb.__swiftdropDb ?? new DatabaseSync(dbPath);
if (process.env.NODE_ENV !== "production") globalForDb.__swiftdropDb = db;

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA busy_timeout = 5000;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('MERCHANT','COURIER','ADMIN')),
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
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// --- Step 1: onboarding & account states ---
ensureColumn("users", "full_name", "TEXT");
ensureColumn("users", "status", "TEXT NOT NULL DEFAULT 'active'"); // active | suspended
ensureColumn("users", "locale", "TEXT NOT NULL DEFAULT 'en'");

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

db.exec(`
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
`);
