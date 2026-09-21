import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { listOpenBatches, listOrdersInBatch, getCourierProfileByUserId } from "@/lib/repo";
import { courierBlockReason } from "@/lib/guards";

/**
 * GET /api/batches — open multi-stop routes a courier can take in one tap.
 * Pro/Gold couriers see them first (blueprint tier perk: "top priority for
 * batch routes") — enforced here by hiding batches from Starter couriers
 * for the first two minutes after creation.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (user.role === "COURIER") {
    const courier = getCourierProfileByUserId(user.id);
    const blocked = courierBlockReason(courier);
    if (blocked) return NextResponse.json({ error: blocked }, { status: 403 });

    const headStart = ["PRO", "GOLD"].includes(courier!.tier) ? 0 : 120_000;
    const batches = listOpenBatches()
      .filter((b) => Date.now() - new Date(b.created_at).getTime() >= headStart)
      .map((b) => ({
        id: b.id,
        stopCount: b.stop_count,
        totalKm: b.total_km,
        totalCourierFeeCents: b.total_courier_fee_cents,
        createdAt: b.created_at,
        orders: listOrdersInBatch(b.id).map((o) => ({
          id: o!.id,
          sequence: o!.batchSequence,
          dropoffAddress: o!.dropoffAddress,
          customerName: o!.customerName,
        })),
      }));

    return NextResponse.json({ batches });
  }

  // Admin view — everything, no head start.
  const batches = listOpenBatches().map((b) => ({
    id: b.id,
    stopCount: b.stop_count,
    totalKm: b.total_km,
    totalCourierFeeCents: b.total_courier_fee_cents,
    createdAt: b.created_at,
    orders: listOrdersInBatch(b.id),
  }));
  return NextResponse.json({ batches });
}
