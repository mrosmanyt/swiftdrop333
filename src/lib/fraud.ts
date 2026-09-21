import { db } from "@/lib/db";
import { haversineKm } from "@/lib/geo";
import { randomUUID } from "node:crypto";

/**
 * Fraud and abuse detection.
 *
 * These are cheap, explainable rules — not a black box. Each one flags for
 * human review rather than auto-punishing, because a false positive that
 * suspends an honest courier costs more than a missed flag.
 */

export type FraudRule =
  | "impossible_speed"
  | "duplicate_pod"
  | "excessive_cancels"
  | "instant_delivery"
  | "location_stale";

const now = () => new Date().toISOString();

function flag(input: {
  subjectType: "courier" | "merchant" | "order";
  subjectId: string;
  orderId?: string | null;
  rule: FraudRule;
  severity: "low" | "medium" | "high";
  detail: string;
}) {
  // Don't stack identical open flags for the same subject + rule.
  const existing = db
    .prepare(
      `SELECT id FROM fraud_flags WHERE subject_type = ? AND subject_id = ? AND rule = ? AND status = 'open'
       AND (order_id IS ? OR order_id = ?)`
    )
    .get(input.subjectType, input.subjectId, input.rule, input.orderId ?? null, input.orderId ?? null);
  if (existing) return null;

  const flagId = randomUUID();
  db.prepare(
    `INSERT INTO fraud_flags (id, subject_type, subject_id, order_id, rule, severity, detail, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)`
  ).run(
    flagId,
    input.subjectType,
    input.subjectId,
    input.orderId ?? null,
    input.rule,
    input.severity,
    input.detail,
    now()
  );
  return flagId;
}

/**
 * GPS spoofing check: two consecutive pings that imply a speed no vehicle
 * could manage. 200 km/h between pings in a city means the location is
 * being faked (or the device jumped networks — hence "review", not "ban").
 */
export function checkLocationJump(courierId: string, lat: number, lng: number) {
  const last = db
    .prepare(
      `SELECT lat, lng, created_at FROM courier_location_pings
       WHERE courier_id = ? ORDER BY created_at DESC LIMIT 1`
    )
    .get(courierId) as any;
  if (!last) return null;

  const km = haversineKm(last.lat, last.lng, lat, lng);
  const seconds = (Date.now() - new Date(last.created_at).getTime()) / 1000;
  if (seconds <= 0 || km < 0.5) return null;

  const kmh = km / (seconds / 3600);
  if (kmh > 200) {
    return flag({
      subjectType: "courier",
      subjectId: courierId,
      rule: "impossible_speed",
      severity: kmh > 800 ? "high" : "medium",
      detail: `Moved ${km.toFixed(1)} km in ${Math.round(seconds)}s (${Math.round(kmh)} km/h)`,
    });
  }
  return null;
}

/**
 * Same proof-of-delivery photo reused across deliveries — the classic way
 * a courier fakes drops without leaving home.
 */
export function checkDuplicateProof(orderId: string, courierId: string, proofUrl: string) {
  const dupe = db
    .prepare(
      `SELECT id FROM orders WHERE proof_of_delivery_url = ? AND id != ? LIMIT 1`
    )
    .get(proofUrl, orderId) as any;
  if (!dupe) return null;

  return flag({
    subjectType: "courier",
    subjectId: courierId,
    orderId,
    rule: "duplicate_pod",
    severity: "high",
    detail: `Proof photo already used on order ${dupe.id}`,
  });
}

/**
 * Delivery completed suspiciously fast after pickup — e.g. marked
 * delivered 40 seconds after collecting a parcel 6 km away.
 */
export function checkInstantDelivery(orderId: string, courierId: string) {
  const o = db
    .prepare(
      `SELECT picked_up_at, delivered_at, distance_km FROM orders WHERE id = ?`
    )
    .get(orderId) as any;
  if (!o?.picked_up_at || !o?.delivered_at) return null;

  const minutes = (new Date(o.delivered_at).getTime() - new Date(o.picked_up_at).getTime()) / 60000;
  const km = o.distance_km ?? 0;
  if (km < 1) return null;

  // Even a fast cyclist needs roughly 1.5 min/km in a city.
  const plausibleMinutes = km * 1.0;
  if (minutes < plausibleMinutes && minutes < 3) {
    return flag({
      subjectType: "courier",
      subjectId: courierId,
      orderId,
      rule: "instant_delivery",
      severity: "medium",
      detail: `${km.toFixed(1)} km delivered in ${minutes.toFixed(1)} min`,
    });
  }
  return null;
}

/** A courier failing or cancelling a lot of deliveries in a short window. */
export function checkCancelRate(courierId: string) {
  const row = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status IN ('FAILED','RETURNING','RETURNED') THEN 1 ELSE 0 END) as bad,
         COUNT(*) as total
       FROM orders
       WHERE courier_id = ? AND assigned_at >= datetime('now','-7 days')`
    )
    .get(courierId) as any;

  const total = row?.total ?? 0;
  const bad = row?.bad ?? 0;
  if (total >= 5 && bad / total > 0.3) {
    return flag({
      subjectType: "courier",
      subjectId: courierId,
      rule: "excessive_cancels",
      severity: "medium",
      detail: `${bad} of ${total} deliveries failed or returned in the last 7 days`,
    });
  }
  return null;
}

export function listFraudFlags(status = "open") {
  return db
    .prepare(
      `SELECT f.*, u.email as courierEmail FROM fraud_flags f
       LEFT JOIN courier_profiles c ON c.id = f.subject_id AND f.subject_type = 'courier'
       LEFT JOIN users u ON u.id = c.user_id
       WHERE f.status = ? ORDER BY
         CASE f.severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
         f.created_at DESC
       LIMIT 100`
    )
    .all(status)
    .map((r: any) => ({ ...(r as object) })) as any[];
}

export function resolveFraudFlag(flagId: string, status: "reviewed" | "dismissed", adminUserId: string) {
  const result = db
    .prepare(`UPDATE fraud_flags SET status = ?, reviewed_by = ? WHERE id = ?`)
    .run(status, adminUserId, flagId);
  return result.changes > 0;
}
