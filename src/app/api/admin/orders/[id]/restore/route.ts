import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getOrderById, restoreOrder } from "@/lib/repo";

// POST /api/admin/orders/:id/restore — brings a soft-deleted order back out
// of /admin/deleted-records into the main orders list.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const order = getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  restoreOrder(order.id, auth.id);
  return NextResponse.json({ ok: true });
}
