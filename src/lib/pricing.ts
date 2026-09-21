/**
 * Pricing engine (v1 — rule-based flat/zone rate).
 *
 * Platform take-rate is centralized here so it can become a per-zone admin
 * setting later without touching every call site.
 */

const PLATFORM_TAKE_RATE = 0.28; // 28% platform / 72% courier — beats Trexity's ~30/70 split

export type ServiceType = "NEXT_DAY" | "SAME_DAY" | "DIRECT" | "BATCH";

interface PriceInput {
  baseRateCents: number;
  perKmCents: number;
  distanceKm: number;
  serviceType: ServiceType;
}

const SERVICE_TYPE_MULTIPLIER: Record<ServiceType, number> = {
  NEXT_DAY: 0.85,
  SAME_DAY: 1.0,
  DIRECT: 1.6,
  BATCH: 0.7,
};

export function computeOrderPrice({ baseRateCents, perKmCents, distanceKm, serviceType }: PriceInput) {
  const distanceCents = Math.round(perKmCents * distanceKm);
  const subtotal = baseRateCents + distanceCents;
  const priceCents = Math.round(subtotal * SERVICE_TYPE_MULTIPLIER[serviceType]);

  const platformFeeCents = Math.round(priceCents * PLATFORM_TAKE_RATE);
  const courierFeeCents = priceCents - platformFeeCents;

  return { priceCents, courierFeeCents, platformFeeCents };
}

export interface CourierStats14d {
  completionRate: number;
  deliveries: number;
  misdeliveries: number;
  complaints: number;
  suspensions: number;
}

export type CourierTier = "STARTER" | "SILVER" | "GOLD" | "PRO";

/** Courier tier thresholds (blueprint §5), evaluated over a rolling 14-day window. */
export function computeCourierTier(stats: CourierStats14d): CourierTier {
  const { completionRate, deliveries, misdeliveries, complaints, suspensions } = stats;

  if (completionRate >= 0.98 && deliveries >= 200 && complaints === 0 && suspensions === 0) {
    return "PRO";
  }
  if (completionRate >= 0.97 && deliveries >= 120 && misdeliveries === 0) {
    return "GOLD";
  }
  if (completionRate >= 0.95 && deliveries >= 50) {
    return "SILVER";
  }
  return "STARTER";
}

/** Per-delivery bonus in cents, layered on top of courierFeeCents. */
export const TIER_BONUS_CENTS: Record<CourierTier, number> = {
  STARTER: 0,
  SILVER: 5,
  GOLD: 10,
  PRO: 20, // beats Trexity Pro's $0.15/delivery
};

export const TIER_THRESHOLDS: Record<CourierTier, number> = {
  STARTER: 0,
  SILVER: 50,
  GOLD: 120,
  PRO: 200,
};

export function nextTierProgress(stats: CourierStats14d) {
  const tier = computeCourierTier(stats);
  const order: CourierTier[] = ["STARTER", "SILVER", "GOLD", "PRO"];
  const idx = order.indexOf(tier);
  if (idx === order.length - 1) return { tier, message: "You're at the top tier — keep your completion rate up to stay here." };
  const next = order[idx + 1];
  const remaining = Math.max(TIER_THRESHOLDS[next] - stats.deliveries, 0);
  return { tier, message: `${remaining} more deliveries this period to reach ${next}.` };
}
