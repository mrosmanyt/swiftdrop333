import { randomUUID } from "node:crypto";
import webpush from "web-push";
import { db } from "@/lib/db";

/**
 * Web push — real OS-level notifications delivered through the browser's
 * push service (works even when the SwiftDrop tab/app isn't open), used
 * for the two things worth interrupting someone for: a driver's new
 * delivery offer (it's timed — they need to see it now), and a customer's
 * order status changing (courier assigned, picked up, delivered).
 *
 * Works with or without VAPID_PRIVATE_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * set — without them, pushToUser/pushToOrder just no-op, so nothing
 * breaks in an environment that hasn't configured push yet.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:support@swiftdrop.app";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
  return true;
}

export type PushSubjectType = "user" | "order";

interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Path to open when the notification is tapped, e.g. "/driver/offers". */
  url?: string;
  /** Same-tag notifications replace each other instead of stacking. */
  tag?: string;
}

/** Save (or update) a subscription for a signed-in user or a guest order. */
export function savePushSubscription(subjectType: PushSubjectType, subjectId: string, sub: SubscriptionInput) {
  db.prepare(
    `INSERT INTO push_subscriptions (id, subject_type, subject_id, endpoint, p256dh, auth, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET
       subject_type = excluded.subject_type,
       subject_id = excluded.subject_id,
       p256dh = excluded.p256dh,
       auth = excluded.auth`
  ).run(randomUUID(), subjectType, subjectId, sub.endpoint, sub.keys.p256dh, sub.keys.auth, new Date().toISOString());
}

export function removePushSubscription(endpoint: string) {
  db.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).run(endpoint);
}

function subscriptionsFor(subjectType: PushSubjectType, subjectId: string): SubscriptionRow[] {
  return db
    .prepare(`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE subject_type = ? AND subject_id = ?`)
    .all(subjectType, subjectId) as unknown as SubscriptionRow[];
}

async function deliver(row: SubscriptionRow, payload: PushPayload) {
  try {
    await webpush.sendNotification(
      { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
      JSON.stringify(payload)
    );
  } catch (e: any) {
    // 404/410 means the browser dropped this subscription (uninstalled,
    // site data cleared) — the push service is telling us to stop trying.
    if (e?.statusCode === 404 || e?.statusCode === 410) removePushSubscription(row.endpoint);
  }
}

/** Push to every device a signed-in user (driver/merchant/admin) has opted in on. */
export async function pushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured() || !userId) return;
  const rows = subscriptionsFor("user", userId);
  await Promise.all(rows.map((r) => deliver(r, payload)));
}

/** Push to whoever opted in on this specific order's tracking page (the customer). */
export async function pushToOrder(orderId: string, payload: PushPayload) {
  if (!ensureConfigured() || !orderId) return;
  const rows = subscriptionsFor("order", orderId);
  await Promise.all(rows.map((r) => deliver(r, payload)));
}

export function isPushConfigured() {
  return !!(PUBLIC_KEY && PRIVATE_KEY);
}
