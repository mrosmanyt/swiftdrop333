import { createBatch, listBatchableOrders, listOrdersInBatch } from "@/lib/repo";
import { clusterOrders, optimizeRoute, Stop } from "@/lib/batching";

/**
 * Turn loose pending orders into optimized multi-stop routes.
 *
 * Runs on demand (admin button, or the dispatch tick). Only touches
 * BATCH/NEXT_DAY orders — same-day and Direct stay single-drop because
 * speed matters more than density for those.
 */
export function runBatchingPass(options?: { maxStops?: number; radiusKm?: number }) {
  const orders = listBatchableOrders(100);
  const clusters = clusterOrders(orders as any[], options);

  const created: { batchId: string; stops: number; savingsPercent: number; totalKm: number }[] = [];

  for (const cluster of clusters) {
    const clusterOrdersList = orders.filter((o) => cluster.orderIds.includes(o!.id));
    if (clusterOrdersList.length < 2) continue;

    // Every order in a cluster shares a zone; use the first pickup as the
    // route start (typical case: one merchant sending several parcels).
    const first = clusterOrdersList[0]!;
    const start: Stop = {
      id: "start",
      lat: first.pickupLat ?? first.dropoffLat!,
      lng: first.pickupLng ?? first.dropoffLng!,
    };

    const stops: Stop[] = clusterOrdersList.map((o) => ({
      id: o!.id,
      lat: o!.dropoffLat!,
      lng: o!.dropoffLng!,
    }));

    const optimized = optimizeRoute(stops, start);
    const totalCourierFee = clusterOrdersList.reduce((sum, o) => sum + (o!.courierFeeCents ?? 0), 0);

    const batchId = createBatch({
      zoneId: cluster.zoneId,
      orderIds: optimized.stops.map((s) => s.id),
      totalKm: Math.round(optimized.totalKm * 100) / 100,
      totalCourierFeeCents: totalCourierFee,
    });

    created.push({
      batchId,
      stops: optimized.stops.length,
      savingsPercent: optimized.savingsPercent,
      totalKm: Math.round(optimized.totalKm * 100) / 100,
    });
  }

  return { considered: orders.length, batchesCreated: created.length, batches: created };
}

/** Re-run optimization on an existing batch (e.g. after a stop is removed). */
export function reoptimizeBatch(batchId: string) {
  const orders = listOrdersInBatch(batchId);
  const withCoords = orders.filter((o) => o!.dropoffLat != null && o!.dropoffLng != null);
  if (withCoords.length < 2) return null;

  const first = withCoords[0]!;
  const start: Stop = {
    id: "start",
    lat: first.pickupLat ?? first.dropoffLat!,
    lng: first.pickupLng ?? first.dropoffLng!,
  };
  const stops: Stop[] = withCoords.map((o) => ({ id: o!.id, lat: o!.dropoffLat!, lng: o!.dropoffLng! }));
  return optimizeRoute(stops, start);
}
