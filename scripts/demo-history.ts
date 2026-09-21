/**
 * Demo history — gives the seeded merchant and courier a believable two
 * weeks of completed work.
 *
 * Without this, a fresh install shows one courier with a single $7 delivery
 * and a merchant with no API keys, which makes it impossible to tell whether
 * the earnings, tier, pay-transparency and webhook screens actually work.
 * Everything here is ordinary demo data written through the same tables the
 * app writes to — no special-casing anywhere in the product code.
 *
 * Idempotent: it does nothing if a history already exists.
 */
import crypto from "node:crypto";
import { db } from "../src/lib/db";

const uid = () => crypto.randomUUID();
const iso = (d: Date) => d.toISOString();

/** Deterministic pseudo-random so every install gets the same demo numbers. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const DROPOFFS: Array<[string, number, number]> = [
  ["80 Spadina Ave, Toronto, ON", 43.6465, -79.3955],
  ["250 University Ave, Toronto, ON", 43.6507, -79.3879],
  ["88 Dundas St E, Toronto, ON", 43.6563, -79.3767],
  ["1 Front St W, Toronto, ON", 43.6453, -79.3806],
  ["456 King St W, Toronto, ON", 43.6448, -79.3966],
  ["390 Bathurst St, Toronto, ON", 43.6533, -79.4045],
  ["14 Spadina Ave, Toronto, ON", 43.6390, -79.3925],
  ["720 Bay St, Toronto, ON", 43.6602, -79.3856],
];

const CUSTOMERS = [
  "Ayesha Khan", "Daniel Chen", "Maria Santos", "Omar Farooq", "Priya Sharma",
  "Lucas Tremblay", "Grace Okafor", "Noah Bergeron", "Ivy Zhang", "Samir Haddad",
];

const SERVICE_TYPES = ["SAME_DAY", "SAME_DAY", "SAME_DAY", "NEXT_DAY", "DIRECT", "BATCH"];

export function seedDemoHistory() {
  const courier = db
    .prepare(
      `SELECT c.id FROM courier_profiles c
       JOIN users u ON u.id = c.user_id WHERE u.email = 'courier@example.com'`
    )
    .get() as any;
  const merchant = db
    .prepare(
      `SELECT m.id, m.business_address FROM merchant_profiles m
       JOIN users u ON u.id = m.user_id WHERE u.email = 'merchant@example.com'`
    )
    .get() as any;
  const zone = db.prepare(`SELECT id FROM zones ORDER BY name LIMIT 1`).get() as any;
  if (!courier || !merchant || !zone) return;

  const existing = db
    .prepare(`SELECT COUNT(*) as c FROM orders WHERE courier_id = ? AND status = 'DELIVERED'`)
    .get(courier.id) as any;
  if ((existing?.c ?? 0) > 3) return; // already has a history

  const rng = makeRng(20260914);
  const pickup = merchant.business_address || "123 Queen St W, Toronto, ON";
  const insertOrder = db.prepare(
    `INSERT INTO orders (
       id, merchant_id, courier_id, zone_id,
       pickup_address, pickup_lat, pickup_lng,
       dropoff_address, dropoff_lat, dropoff_lng,
       customer_name, customer_phone, service_type, status,
       price_cents, courier_fee_cents, platform_fee_cents,
       customer_rating, distance_km, distance_source, dispatch_mode, source,
       created_at, assigned_at, picked_up_at, delivered_at
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'DELIVERED',?,?,?,?,?,'haversine','auto','portal',?,?,?,?)`
  );

  let made = 0;
  for (let dayBack = 13; dayBack >= 0; dayBack--) {
    // Busier midweek, quieter on Sundays — the shape a real courier sees.
    const day = new Date(Date.now() - dayBack * 86400000);
    const dow = day.getDay();
    const perDay = dow === 0 ? 4 : dow === 6 ? 9 : 9 + Math.floor(rng() * 4);

    for (let i = 0; i < perDay; i++) {
      const [addr, lat, lng] = DROPOFFS[Math.floor(rng() * DROPOFFS.length)];
      const serviceType = SERVICE_TYPES[Math.floor(rng() * SERVICE_TYPES.length)];
      const distanceKm = Math.round((1.2 + rng() * 6.5) * 10) / 10;
      const priceCents = Math.round(899 + distanceKm * 50);
      const courierFee = Math.round(priceCents * 0.72);

      const startHour = 9 + Math.floor(rng() * 9);
      const created = new Date(day);
      created.setHours(startHour, Math.floor(rng() * 60), 0, 0);
      const assigned = new Date(created.getTime() + (60 + rng() * 240) * 1000);
      const pickedUp = new Date(assigned.getTime() + (4 + rng() * 7) * 60000);
      const delivered = new Date(pickedUp.getTime() + (9 + rng() * 18) * 60000);

      insertOrder.run(
        uid(), merchant.id, courier.id, zone.id,
        pickup, 43.6503, -79.3889,
        addr, lat, lng,
        CUSTOMERS[Math.floor(rng() * CUSTOMERS.length)],
        "+1 416 555 0" + (100 + Math.floor(rng() * 800)),
        serviceType,
        priceCents, courierFee, priceCents - courierFee,
        rng() < 0.82 ? 5 : 4,
        distanceKm,
        iso(created), iso(assigned), iso(pickedUp), iso(delivered)
      );
      made++;
    }
  }

  // One completed weekly payout, so "available to cash out" is this week's
  // work rather than everything the courier has ever earned.
  const paidOutCents = 12800;
  db.prepare(
    `INSERT INTO payout_requests (id, courier_id, amount_cents, method, status, created_at, processed_at)
     VALUES (?,?,?,'weekly','paid',?,?)`
  ).run(
    uid(), courier.id, paidOutCents,
    iso(new Date(Date.now() - 7 * 86400000)),
    iso(new Date(Date.now() - 6 * 86400000))
  );

  console.log(`  ✓ Demo history: ${made} completed deliveries over the last 14 days.`);
}

export function seedDemoMerchantTools() {
  const merchant = db
    .prepare(
      `SELECT m.id FROM merchant_profiles m
       JOIN users u ON u.id = m.user_id WHERE u.email = 'merchant@example.com'`
    )
    .get() as any;
  const zone = db.prepare(`SELECT id FROM zones ORDER BY name LIMIT 1`).get() as any;
  if (!merchant || !zone) return;

  const keyCount = db
    .prepare(`SELECT COUNT(*) as c FROM api_keys WHERE merchant_id = ?`)
    .get(merchant.id) as any;
  if ((keyCount?.c ?? 0) > 0) return;

  const recurring = db.prepare(
    `INSERT INTO recurring_orders (
       id, merchant_id, zone_id, label, pickup_address, dropoff_address,
       customer_name, customer_phone, service_type, days_of_week,
       window_hour_start, window_hour_end, active, last_generated_date
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?)`
  );
  const today = new Date().toISOString().slice(0, 10);
  recurring.run(
    uid(), merchant.id, zone.id, "Weekday café restock",
    "123 Queen St W, Toronto, ON", "80 Spadina Ave, Toronto, ON",
    "Rosewood Café", "+1 416 555 0142", "SAME_DAY", "1,2,3,4,5", 9, 11, today
  );
  recurring.run(
    uid(), merchant.id, zone.id, "Saturday market run",
    "123 Queen St W, Toronto, ON", "390 Bathurst St, Toronto, ON",
    "St. Andrew Market", "+1 647 555 0119", "BATCH", "6", 7, 9, today
  );

  // Demo keys only — the hash is random bytes, so neither of these can
  // actually authenticate. Create a real key from the Tools page.
  const key = db.prepare(
    `INSERT INTO api_keys (id, merchant_id, name, key_prefix, key_hash, webhook_url, last_used_at)
     VALUES (?,?,?,?,?,?,?)`
  );
  key.run(
    uid(), merchant.id, "Shopify store", "sk_live_7Qa4",
    crypto.randomBytes(24).toString("hex"),
    "https://cornerbakery.ca/hooks/swiftdrop",
    iso(new Date(Date.now() - 3600000))
  );
  key.run(
    uid(), merchant.id, "Warehouse script", "sk_live_M2xD",
    crypto.randomBytes(24).toString("hex"),
    "https://ops.cornerbakery.ca/api/delivery-events",
    iso(new Date(Date.now() - 22 * 3600000))
  );

  const hook = db.prepare(
    `INSERT INTO webhook_deliveries (id, merchant_id, order_id, event, url, status, response_code, created_at)
     VALUES (?,?,NULL,?,?,'delivered',?,?)`
  );
  const events: Array<[string, string, number, number]> = [
    ["order.delivered", "https://cornerbakery.ca/hooks/swiftdrop", 200, 40],
    ["order.picked_up", "https://cornerbakery.ca/hooks/swiftdrop", 200, 68],
    ["order.assigned", "https://cornerbakery.ca/hooks/swiftdrop", 200, 77],
    ["order.created", "https://ops.cornerbakery.ca/api/delivery-events", 202, 82],
  ];
  for (const [event, url, code, minsAgo] of events) {
    hook.run(uid(), merchant.id, event, url, code, iso(new Date(Date.now() - minsAgo * 60000)));
  }

  console.log("  ✓ Demo tools: 2 recurring schedules, 2 API keys, 4 webhook deliveries.");
}
