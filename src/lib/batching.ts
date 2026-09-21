import { haversineKm } from "@/lib/geo";

/**
 * Route optimization for multi-stop batches.
 *
 * This is the single biggest cost lever in last-mile delivery: handing a
 * courier 8 parcels in a sensible order instead of 8 separate round trips.
 * Blueprint §11 item 1 — the concrete reason SwiftDrop can pay couriers
 * more than Trexity without thinning margin.
 *
 * Algorithm: nearest-neighbour to build a first route, then 2-opt to
 * un-cross it. Exact TSP is overkill (and NP-hard); nearest-neighbour +
 * 2-opt typically lands within a few percent of optimal for the 5-15 stop
 * routes this actually deals with, and runs in microseconds.
 */

export interface Stop {
  id: string;
  lat: number;
  lng: number;
}

function distance(a: Stop, b: Stop) {
  return haversineKm(a.lat, a.lng, b.lat, b.lng);
}

export function routeLengthKm(stops: Stop[], start?: Stop) {
  if (stops.length === 0) return 0;
  let total = 0;
  let prev = start ?? stops[0];
  const rest = start ? stops : stops.slice(1);
  for (const s of rest) {
    total += distance(prev, s);
    prev = s;
  }
  return total;
}

/** Greedy nearest-neighbour ordering from a starting point. */
export function nearestNeighbourRoute(stops: Stop[], start: Stop): Stop[] {
  const remaining = [...stops];
  const route: Stop[] = [];
  let current = start;

  while (remaining.length) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    remaining.forEach((s, i) => {
      const d = distance(current, s);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    });
    current = remaining[bestIndex];
    route.push(current);
    remaining.splice(bestIndex, 1);
  }
  return route;
}

/** 2-opt improvement: repeatedly reverse a segment if it shortens the route. */
export function twoOpt(route: Stop[], start: Stop, maxPasses = 40): Stop[] {
  if (route.length < 4) return route;
  let best = [...route];
  let bestLength = routeLengthKm(best, start);
  let improved = true;
  let passes = 0;

  while (improved && passes < maxPasses) {
    improved = false;
    passes++;
    for (let i = 0; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, k + 1).reverse(),
          ...best.slice(k + 1),
        ];
        const length = routeLengthKm(candidate, start);
        if (length < bestLength - 1e-9) {
          best = candidate;
          bestLength = length;
          improved = true;
        }
      }
    }
  }
  return best;
}

export interface OptimizedRoute {
  stops: Stop[];
  totalKm: number;
  naiveKm: number;
  savingsPercent: number;
}

/**
 * Optimize a set of drop-offs starting from the pickup point.
 * Reports the saving against the naive "in the order they came in" route,
 * which is what the admin dashboard shows as the efficiency number.
 */
export function optimizeRoute(stops: Stop[], start: Stop): OptimizedRoute {
  const naiveKm = routeLengthKm(stops, start);
  if (stops.length < 2) {
    return { stops, totalKm: naiveKm, naiveKm, savingsPercent: 0 };
  }

  const greedy = nearestNeighbourRoute(stops, start);
  const optimized = twoOpt(greedy, start);
  const totalKm = routeLengthKm(optimized, start);
  const savingsPercent = naiveKm > 0 ? ((naiveKm - totalKm) / naiveKm) * 100 : 0;

  return {
    stops: optimized,
    totalKm,
    naiveKm,
    savingsPercent: Math.max(0, Math.round(savingsPercent * 10) / 10),
  };
}

/**
 * Group pending orders into batches that make sense to carry together:
 * same zone, drop-offs within `radiusKm` of each other, capped at
 * `maxStops`. Orders without coordinates can't be batched safely, so they
 * stay single.
 */
export function clusterOrders(
  orders: { id: string; zoneId: string | null; dropoffLat: number | null; dropoffLng: number | null }[],
  { maxStops = 8, radiusKm = 3 }: { maxStops?: number; radiusKm?: number } = {}
) {
  const usable = orders.filter((o) => o.dropoffLat != null && o.dropoffLng != null && o.zoneId);
  const byZone = new Map<string, typeof usable>();
  for (const o of usable) {
    const list = byZone.get(o.zoneId!) ?? [];
    list.push(o);
    byZone.set(o.zoneId!, list);
  }

  const clusters: { zoneId: string; orderIds: string[] }[] = [];

  for (const [zoneId, zoneOrders] of byZone) {
    const pool = [...zoneOrders];
    while (pool.length) {
      const seed = pool.shift()!;
      const group = [seed];
      for (let i = pool.length - 1; i >= 0 && group.length < maxStops; i--) {
        const candidate = pool[i];
        const d = haversineKm(
          seed.dropoffLat!,
          seed.dropoffLng!,
          candidate.dropoffLat!,
          candidate.dropoffLng!
        );
        if (d <= radiusKm) {
          group.push(candidate);
          pool.splice(i, 1);
        }
      }
      // A "batch" of one isn't a batch.
      if (group.length >= 2) {
        clusters.push({ zoneId, orderIds: group.map((g) => g.id) });
      }
    }
  }

  return clusters;
}
