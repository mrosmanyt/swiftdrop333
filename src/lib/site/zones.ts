import { computeOrderPrice, type ServiceType } from "@/lib/pricing";

/**
 * Delivery zones for the public price calculator.
 *
 * A zone is a distance band around the pickup address: Zone 1 is 0–3 km
 * away, Zone 2 is 3–6 km, and so on. Prices are NOT a separate table — they
 * are worked out with the same pricing engine that prices real orders
 * (src/lib/pricing.ts) from the rates in admin → Zones & pricing, so the
 * calculator can never advertise a price the platform would not charge.
 *
 * No server-only imports — this file is used in the browser too.
 */

export const ZONE_BAND_KM = 3;
export const ZONE_COUNT = 12;

/** Straight-line distance → typical driving distance in a city (same factor the order engine falls back to). */
export const ROAD_FACTOR = 1.35;

/**
 * Used only for a city that has no rate set up yet in admin → Zones &
 * pricing. Create a rate for each city there so the calculator shows the
 * numbers you actually charge.
 */
export const STANDARD_RATE = { baseRateCents: 1190, perKmCents: 35 };

export const CALCULATOR_SERVICES: { value: ServiceType; label: string }[] = [
  { value: "SAME_DAY", label: "Same Day" },
  { value: "NEXT_DAY", label: "Next Day" },
  { value: "DIRECT", label: "Direct" },
  { value: "BATCH", label: "Batch" },
];

export interface RateArea {
  id: string;
  name: string;
  baseRateCents: number;
  perKmCents: number;
  surgeMultiplier: number;
  /** true when this is STANDARD_RATE rather than a rate from the admin console. */
  standard?: boolean;
}

export interface ZoneBand {
  n: number;
  fromKm: number;
  toKm: number;
  /** Price at the near edge and the far edge of the zone, in cents. */
  minCents: number;
  maxCents: number;
}

/** Estimated price for a delivery `straightKm` away (as the crow flies). */
export function estimateCents(rate: RateArea, service: ServiceType, straightKm: number): number {
  return computeOrderPrice({
    baseRateCents: rate.baseRateCents,
    perKmCents: rate.perKmCents,
    distanceKm: straightKm * ROAD_FACTOR,
    serviceType: service,
    surgeMultiplier: rate.surgeMultiplier,
  }).priceCents;
}

export function zoneBands(rate: RateArea, service: ServiceType, maxKm: number): ZoneBand[] {
  const count = Math.min(ZONE_COUNT, Math.max(1, Math.ceil(maxKm / ZONE_BAND_KM)));
  return Array.from({ length: count }, (_, i) => {
    const fromKm = i * ZONE_BAND_KM;
    const toKm = (i + 1) * ZONE_BAND_KM;
    return { n: i + 1, fromKm, toKm, minCents: estimateCents(rate, service, fromKm), maxCents: estimateCents(rate, service, toKm) };
  });
}

/** Which zone a distance falls in (1-based), or null when it is beyond the last zone. */
export function zoneNumberFor(straightKm: number, zoneCount: number): number | null {
  const n = Math.floor(straightKm / ZONE_BAND_KM) + 1;
  return n <= zoneCount ? n : null;
}

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** One distinct colour per zone, readable on a light map. */
export const ZONE_COLORS = [
  "#2563eb", "#0891b2", "#059669", "#65a30d", "#ca8a04", "#ea580c",
  "#dc2626", "#db2777", "#9333ea", "#4f46e5", "#0d9488", "#57534e",
];
