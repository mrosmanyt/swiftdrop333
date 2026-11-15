// GENERATED from migrations/*.sql by scripts/build-schema.mjs — do not edit by hand.
// Each entry is applied once, in order, and recorded in schema_migrations.
export const MIGRATIONS: { version: number; name: string; sql: string }[] = [
  { version: 1, name: "001-postgres", sql: String.raw`-- Initial PostgreSQL schema. Review and validate against PostgreSQL before applying.
-- Text timestamps and integer flags intentionally preserve the existing application contract.
-- No user records are included. Apply once to an empty application schema.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('MERCHANT','COURIER','ADMIN','CUSTOMER')),
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')),
  updated_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
, full_name TEXT, status TEXT NOT NULL DEFAULT 'active', locale TEXT NOT NULL DEFAULT 'en', erased_at TEXT, erase_after TEXT, password_changed_at TEXT);

CREATE TABLE zones (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  name TEXT NOT NULL,
  base_rate_cents INTEGER NOT NULL,
  per_km_cents INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
, surge_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0, surge_note TEXT);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL,   -- 'courier' | 'merchant'
  owner_id TEXT NOT NULL,
  doc_type TEXT NOT NULL,     -- 'drivers_license' | 'insurance' | 'vehicle_registration' | 'business_licence' | 'void_cheque'
  url TEXT NOT NULL,
  original_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | rejected
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
, reviewed_at TEXT, file_purged_at TEXT);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE fraud_flags (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,          -- courier | merchant | order
  subject_id TEXT NOT NULL,
  order_id TEXT,
  rule TEXT NOT NULL,                  -- impossible_speed | duplicate_pod | excessive_cancels | instant_delivery
  severity TEXT NOT NULL DEFAULT 'medium',
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open | reviewed | dismissed
  reviewed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE webhook_deliveries (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  order_id TEXT,
  event TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  response_code INTEGER,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_deliveries INTEGER NOT NULL,
  bonus_cents INTEGER NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  min_tier TEXT NOT NULL DEFAULT 'STARTER',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,   -- user | order
  subject_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE merchant_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  business_name TEXT NOT NULL,
  kyb_status TEXT NOT NULL DEFAULT 'pending',
  payout_method TEXT,
  shopify_domain TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
, contact_name TEXT, business_phone TEXT, business_address TEXT, business_number TEXT, website TEXT, kyb_notes TEXT, reviewed_at TEXT, reviewed_by TEXT, rating DOUBLE PRECISION NOT NULL DEFAULT 5.0, deleted_at TEXT, deleted_by TEXT);

CREATE TABLE courier_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('BIKE','SCOOTER','CAR','VAN')),
  license_number TEXT,
  insurance_doc_url TEXT,
  background_check_status TEXT NOT NULL DEFAULT 'pending',
  tier TEXT NOT NULL DEFAULT 'STARTER',
  rating DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  payout_account_id TEXT,
  is_online INTEGER NOT NULL DEFAULT 0,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  last_location_at TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
, full_name TEXT, phone TEXT, license_expiry TEXT, insurance_provider TEXT, insurance_policy_number TEXT, insurance_expiry TEXT, license_doc_url TEXT, vehicle_make_model TEXT, vehicle_plate TEXT, approval_status TEXT NOT NULL DEFAULT 'pending', approval_notes TEXT, reviewed_at TEXT, reviewed_by TEXT, payout_balance_cents INTEGER NOT NULL DEFAULT 0, has_insulated_bag INTEGER NOT NULL DEFAULT 0, locale TEXT NOT NULL DEFAULT 'en', deleted_at TEXT, deleted_by TEXT, emergency_contact_name TEXT, emergency_contact_phone TEXT);

CREATE TABLE admin_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  permissions TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE customer_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  label TEXT NOT NULL DEFAULT 'Home',
  address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE loyalty_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  points INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE surge_alerts (
  id TEXT PRIMARY KEY,
  zone_id TEXT NOT NULL REFERENCES zones(id),
  waiting_count INTEGER NOT NULL,
  bonus_cents INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchant_profiles(id),
  courier_id TEXT REFERENCES courier_profiles(id),
  zone_id TEXT REFERENCES zones(id),
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lng DOUBLE PRECISION,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  delivery_instructions TEXT,
  package_weight_kg DOUBLE PRECISION,
  service_type TEXT NOT NULL DEFAULT 'SAME_DAY',
  status TEXT NOT NULL DEFAULT 'PENDING',
  price_cents INTEGER NOT NULL,
  courier_fee_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  proof_of_delivery_url TEXT,
  customer_rating INTEGER,
  customer_comment TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')),
  assigned_at TEXT,
  picked_up_at TEXT,
  delivered_at TEXT
, window_start TEXT, window_end TEXT, distance_km DOUBLE PRECISION, distance_source TEXT, eta_minutes DOUBLE PRECISION, dispatch_mode TEXT NOT NULL DEFAULT 'auto', failure_reason TEXT, returned_at TEXT, arrived_at_pickup TEXT, merchant_rating INTEGER, merchant_rating_comment TEXT, batch_id TEXT, batch_sequence INTEGER, surge_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0, source TEXT NOT NULL DEFAULT 'portal', requires_age_verification INTEGER NOT NULL DEFAULT 0, age_verified_at TEXT, age_verification_method TEXT, temperature_requirement TEXT NOT NULL DEFAULT 'ambient', engaged_minutes DOUBLE PRECISION, deleted_at TEXT, deleted_by TEXT, cancelled_at TEXT, cancelled_by TEXT, cancel_reason TEXT, refund_status TEXT NOT NULL DEFAULT 'none', refund_amount_cents INTEGER, refund_note TEXT, refunded_at TEXT, sla_breach_alerted_at TEXT, pii_purged_at TEXT, proof_purged_at TEXT);

CREATE TABLE payouts (
  id TEXT PRIMARY KEY,
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tax_doc_url TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE batches (
  id TEXT PRIMARY KEY,
  courier_id TEXT REFERENCES courier_profiles(id),
  zone_id TEXT REFERENCES zones(id),
  status TEXT NOT NULL DEFAULT 'open',   -- open | offered | assigned | completed
  stop_count INTEGER NOT NULL DEFAULT 0,
  total_km DOUBLE PRECISION,
  total_courier_fee_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')),
  assigned_at TEXT
);

CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchant_profiles(id),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  webhook_url TEXT,
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE recurring_orders (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchant_profiles(id),
  zone_id TEXT NOT NULL REFERENCES zones(id),
  label TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION, pickup_lng DOUBLE PRECISION,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION, dropoff_lng DOUBLE PRECISION,
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
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE challenge_claims (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  bonus_cents INTEGER NOT NULL,
  claimed_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE payout_requests (
  id TEXT PRIMARY KEY,
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL DEFAULT 0,
  method TEXT NOT NULL,                   -- instant | weekly
  status TEXT NOT NULL DEFAULT 'requested', -- requested | approved | paid | rejected
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')),
  processed_at TEXT
);

CREATE TABLE location_shares (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  type TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE courier_location_pings (
  id TEXT PRIMARY KEY,
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  order_id TEXT REFERENCES orders(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE disputes (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  raised_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
, order_amount_cents INTEGER, resolution_amount_cents INTEGER, resolved_by TEXT, resolved_at TEXT);

CREATE TABLE support_tickets (
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
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')),
  updated_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')),
  resolved_at TEXT
);

CREATE TABLE notifications (
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
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  sender_role TEXT NOT NULL,        -- customer | courier | merchant | admin
  sender_user_id TEXT,              -- null for the customer (no account)
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE offers (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  status TEXT NOT NULL DEFAULT 'offered', -- offered | accepted | declined | expired
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')),
  responded_at TEXT
);

CREATE TABLE loyalty_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  order_id TEXT REFERENCES orders(id),
  points INTEGER NOT NULL,       -- positive = earned, negative = redeemed
  reason TEXT NOT NULL,          -- order_delivered | referral_bonus | referred_signup_bonus | redeemed
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE safety_incidents (
  id TEXT PRIMARY KEY,
  courier_id TEXT NOT NULL REFERENCES courier_profiles(id),
  order_id TEXT REFERENCES orders(id),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'open',   -- open | acknowledged | resolved
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')),
  resolved_at TEXT,
  resolved_by TEXT
);

CREATE TABLE message_read_state (
  order_id TEXT NOT NULL REFERENCES orders(id),
  role TEXT NOT NULL,
  last_read_at TEXT NOT NULL,
  PRIMARY KEY (order_id, role)
);

CREATE TABLE customer_order_links (
  user_id TEXT NOT NULL REFERENCES users(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')),
  PRIMARY KEY (user_id, order_id)
);

CREATE TABLE ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id),
  sender_role TEXT NOT NULL,
  sender_user_id TEXT,
  body TEXT NOT NULL,
  internal INTEGER NOT NULL DEFAULT 0,  -- internal notes aren't shown to the requester
  created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE INDEX idx_orders_merchant ON orders(merchant_id);

CREATE INDEX idx_orders_courier ON orders(courier_id);

CREATE INDEX idx_orders_status ON orders(status);

CREATE INDEX idx_documents_owner ON documents(owner_type, owner_id);

CREATE INDEX idx_audit_target ON audit_log(target_type, target_id);

CREATE INDEX idx_pings_courier ON courier_location_pings(courier_id, created_at);

CREATE INDEX idx_tickets_status ON support_tickets(status, created_at);

CREATE INDEX idx_ticket_messages ON ticket_messages(ticket_id, created_at);

CREATE INDEX idx_fraud_status ON fraud_flags(status, created_at);

CREATE INDEX idx_batches_status ON batches(status);

CREATE INDEX idx_apikeys_merchant ON api_keys(merchant_id);

CREATE INDEX idx_recurring_merchant ON recurring_orders(merchant_id, active);

CREATE UNIQUE INDEX idx_claim_unique ON challenge_claims(challenge_id, courier_id);

CREATE INDEX idx_payout_courier ON payout_requests(courier_id, status);

CREATE INDEX idx_notifications_order ON notifications(order_id);

CREATE INDEX idx_messages_order ON messages(order_id, created_at);

CREATE INDEX idx_offers_order ON offers(order_id, status);

CREATE INDEX idx_offers_courier ON offers(courier_id, status);

CREATE INDEX idx_push_subject ON push_subscriptions(subject_type, subject_id);

CREATE INDEX idx_customer_addresses_user ON customer_addresses(user_id);

CREATE INDEX idx_loyalty_tx_user ON loyalty_transactions(user_id, created_at);

CREATE INDEX idx_surge_alerts_zone ON surge_alerts(zone_id, expires_at);

CREATE INDEX idx_safety_incidents_status ON safety_incidents(status, created_at);

CREATE INDEX idx_location_shares_token ON location_shares(token);

CREATE INDEX idx_customer_order_links_order ON customer_order_links(order_id);
` },
  { version: 2, name: "002-sqlite-compat", sql: String.raw`-- SQLite-compatible date helpers, so the timestamp-as-text contract and the
-- existing queries keep working unchanged on PostgreSQL.
CREATE OR REPLACE FUNCTION datetime(t text) RETURNS text LANGUAGE sql STABLE AS $fn$
  SELECT to_char(
    CASE WHEN t = 'now' THEN (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') ELSE replace(t, 'T', ' ')::timestamp END,
    'YYYY-MM-DD HH24:MI:SS')
$fn$;
CREATE OR REPLACE FUNCTION datetime(t text, m text) RETURNS text LANGUAGE sql STABLE AS $fn$
  SELECT to_char(
    (CASE WHEN t = 'now' THEN (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') ELSE replace(t, 'T', ' ')::timestamp END) + m::interval,
    'YYYY-MM-DD HH24:MI:SS')
$fn$;
` },
  { version: 3, name: "003-merchant-operations", sql: String.raw`-- Merchant operations fields, captured at signup so ops can plan capacity
-- and the admin review queue shows where a business operates and roughly
-- how many parcels a day to expect.
ALTER TABLE merchant_profiles ADD COLUMN business_city TEXT;
ALTER TABLE merchant_profiles ADD COLUMN daily_volume TEXT;
` },
];
