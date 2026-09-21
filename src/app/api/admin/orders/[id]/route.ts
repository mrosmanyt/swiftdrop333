import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getOrderById, softDeleteOrder } from "@/lib/repo";

// DELETE /api/admin/orders/:id — soft delete: the order is hidden from the
// main orders list and moved into /admin/deleted-records, but the row stays
// in the database (and any courier/merchant history stays intact) so it can
// be restored later.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const order = getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  softDeleteOrder(order.id, auth.id);
  return NextResponse.json({ ok: true });
}
