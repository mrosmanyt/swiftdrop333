import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { countMerchants, countCouriers, countOnlineCouriers, orderStatusCounts } from "@/lib/repo";

// GET /api/admin/overview — polled every few seconds by the Ops Overview
// page for a live-feeling dashboard without a full WebSocket layer.
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const statusCounts = orderStatusCounts();
  const totalOrders = statusCounts.reduce((sum, r) => sum + r.count, 0);
  const delivered = statusCounts.find((r) => r.status === "DELIVERED")?.count ?? 0;

  return NextResponse.json({
    merchants: countMerchants(),
    couriers: countCouriers(),
    onlineCouriers: countOnlineCouriers(),
    totalOrders,
    completionRate: totalOrders ? Math.round((delivered / totalOrders) * 1000) / 10 : null,
    statusCounts,
  });
}
