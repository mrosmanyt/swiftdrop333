import {
  adminUserIds,
  candidateCouriersForOrder,
  createOffer,
  expireStaleOffers,
  findNewSlaBreaches,
  getActiveOfferForOrder,
  getMerchantProfileById,
  getOrderById,
  findUserById,
  markSlaBreachAlerted,
  maybeCreateSurgeAlert,
  onlineCourierUserIds,
  ordersNeedingDispatch,
  pendingCountsByZone,
  setOrderDispatchMode,
  setOrderRouteInfo,
} from "@/lib/repo";
import { haversineKm, routeBetween } from "@/lib/geo";
import { pushToUser } from "@/lib/push";
import { maybeRunRetention } from "@/lib/retention";

/**
 * Auto-dispatch engine.
 *
 * An order doesn't just sit in a pool waiting for someone to notice it —
 * the system picks the best courier and offers it to them directly, with a
 * countdown. If they decline or the timer runs out, it moves to the next
 * best courier. Once everyone nearby has passed, it falls back to
 * "broadcast" so any online courier can still grab it rather than the
 * delivery getting stuck.
 *
 * Ranking (best first):
 *   1. distance from the courier's current GPS position to the pickup
 *   2. courier tier — Pro/Gold get first look (that's the tier perk)
 *   3. rating
 *
 * How it runs: `runDispatchTick()` is called whenever the system is
 * already doing work — when an order is created, and from the driver and
 * admin polling endpoints. That keeps the loop alive without a separate
 * worker process. For production scale, call the same function from a cron
 * job or a queue worker every few seconds.
 */

export const OFFER_TTL_SECONDS = Number(process.env.OFFER_TTL_SECONDS ?? 45);
const TIER_RANK: Record<string, number> = { PRO: 0, GOLD: 1, SILVER: 2, STARTER: 3 };

export function rankCandidates(
  couriers: any[],
  pickup: { lat: number | null; lng: number | null }
) {
  return [...couriers].sort((a, b) => {
    // Couriers with a known position, closest first. Unknown position sorts last.
    const da = distanceToPickup(a, pickup);
    const db_ = distanceToPickup(b, pickup);
    if (da !== db_) return da - db_;

    const ta = TIER_RANK[a.tier] ?? 9;
    const tb = TIER_RANK[b.tier] ?? 9;
    if (ta !== tb) return ta - tb;

    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}

function distanceToPickup(courier: any, pickup: { lat: number | null; lng: number | null }) {
  if (courier.lastLat == null || courier.lastLng == null) return Number.MAX_SAFE_INTEGER;
  if (pickup.lat == null || pickup.lng == null) return 0; // no pickup coords — distance can't discriminate
  return haversineKm(courier.lastLat, courier.lastLng, pickup.lat, pickup.lng);
}

/** Offer one order to the single best available courier. */
export async function dispatchOrder(orderId: string): Promise<{ offered: boolean; courierId?: string; reason?: string }> {
  const order = await getOrderById(orderId);
  if (!order) return { offered: false, reason: "order not found" };
  if (order.status !== "PENDING" || order.courierId) {
    return { offered: false, reason: "order no longer pending" };
  }
  if (await getActiveOfferForOrder(orderId)) {
    return { offered: false, reason: "offer already live" };
  }

  const candidates = await candidateCouriersForOrder(orderId);
  if (!candidates.length) {
    // Everyone eligible has already seen it (or nobody is online) — open it
    // up so it doesn't get stuck waiting for a targeted offer.
    if (order.dispatchMode !== "broadcast") await setOrderDispatchMode(orderId, "broadcast");
    return { offered: false, reason: "no candidates — broadcast" };
  }

  const best = rankCandidates(candidates, { lat: order.pickupLat, lng: order.pickupLng })[0];
  await createOffer(orderId, best.id, OFFER_TTL_SECONDS);

  // Fire-and-forget: a driver's offer is timed (OFFER_TTL_SECONDS), so this
  // needs to reach them the moment it's created, not whenever they next
  // happen to check the app. dispatchOrder stays synchronous — the push
  // itself is a background network call that shouldn't block dispatch.
  void pushToUser(best.userId, {
    title: "New delivery offer",
    body: `Nearby pickup${order.pickupAddress ? ` at ${order.pickupAddress}` : ""} — ${OFFER_TTL_SECONDS}s to accept`,
    url: "/driver/offers",
    tag: "offer",
  }).catch(() => {});

  return { offered: true, courierId: best.id };
}

/**
 * One pass of the dispatch loop: expire stale offers, then send a fresh
 * offer for every pending order that doesn't have one.
 */
export async function runDispatchTick() {
  const expired = await expireStaleOffers();
  const pending = await ordersNeedingDispatch();

  let offered = 0;
  let broadcast = 0;
  for (const order of pending) {
    const result = await dispatchOrder(order!.id);
    if (result.offered) offered++;
    else if (result.reason?.includes("broadcast")) broadcast++;
  }

  await checkSurgeZones();
  await checkSlaBreaches();
  void maybeRunRetention();

  return { expired, considered: pending.length, offered, broadcast };
}

/**
 * SLA watch — once per tick, look for in-flight orders that just slipped
 * past their promised window_end. Each one is flagged exactly once
 * (findNewSlaBreaches only returns orders with sla_breach_alerted_at still
 * null), so ops and the merchant both get a single heads-up rather than a
 * push every tick for the same late order.
 */
async function checkSlaBreaches() {
  const breaches = await findNewSlaBreaches();
  if (!breaches.length) return;

  const admins = await adminUserIds();
  for (const order of breaches) {
    if (!order) continue;
    await markSlaBreachAlerted(order.id);

    const label = order.customerName ? `${order.customerName} — ${order.dropoffAddress}` : order.dropoffAddress;
    for (const adminId of admins) {
      void pushToUser(adminId, {
        title: "Late delivery",
        body: `${label} has passed its promised window.`,
        url: `/admin/orders`,
        tag: "sla-breach",
      }).catch(() => {});
    }

    const merchant = order.merchantId ? await getMerchantProfileById(order.merchantId) : null;
    const merchantUser = merchant ? await findUserById(merchant.userId) : null;
    if (merchantUser) {
      void pushToUser(merchantUser.id, {
        title: "Delivery running late",
        body: `${label} has passed its promised delivery window.`,
        url: `/merchant/orders/${order.id}`,
        tag: "sla-breach",
      }).catch(() => {});
    }
  }
}

/**
 * Smart incentives — no admin has to notice a zone backing up. Every tick,
 * each zone's current backlog is checked against the threshold; crossing it
 * for the first time (maybeCreateSurgeAlert is a no-op while an alert for
 * that zone is still live) creates a time-limited bonus and pushes every
 * online courier so the backlog actually gets seen, not just logged.
 */
async function checkSurgeZones() {
  for (const { zoneId, waitingCount } of await pendingCountsByZone()) {
    const alert = await maybeCreateSurgeAlert(zoneId, waitingCount);
    if (!alert) continue;

    const courierUserIds = await onlineCourierUserIds();
    for (const userId of courierUserIds) {
      void pushToUser(userId, {
        title: `Surge — ${alert.zoneName}`,
        body: `${waitingCount} deliveries waiting. Extra $${(alert.bonusCents / 100).toFixed(2)} per drop for the next ${SURGE_ALERT_MINUTES} min.`,
        url: "/driver/demand",
        tag: "surge",
      }).catch(() => {});
    }
  }
}

const SURGE_ALERT_MINUTES = Number(process.env.SURGE_ALERT_TTL_MINUTES ?? 30);

/**
 * Compute and store real route distance + ETA for an order. Called after
 * creation; uses OSRM road routing where reachable, otherwise a
 * detour-adjusted straight line (see lib/geo.ts).
 */
export async function refreshOrderRoute(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order?.pickupLat || !order?.pickupLng || !order?.dropoffLat || !order?.dropoffLng) return null;

  const route = await routeBetween(
    { lat: order.pickupLat, lng: order.pickupLng },
    { lat: order.dropoffLat, lng: order.dropoffLng }
  );
  await setOrderRouteInfo(orderId, route.distanceKm, route.source, route.durationMin);
  return route;
}
