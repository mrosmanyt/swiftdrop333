import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { cancelOrder, getOrderById, getMerchantProfileByUserId, getMerchantProfileById, findUserById } from "@/lib/repo";
import { notifyCancelled } from "@/lib/notify";

const schema = z.object({ reason: z.string().min(1).max(500) });

// POST /api/orders/:id/cancel — merchant cancels their own order, or admin
// cancels any order. Only works before a courier has picked it up
// (PENDING/ASSIGNED) — once it's in the courier's hands, use fail/return
// instead, since the parcel physically has to come back.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("MERCHANT", "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const order = getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (auth.role === "MERCHANT") {
    const merchant = getMerchantProfileByUserId(auth.id);
    if (!merchant || order.merchantId !== merchant.id) {
      return NextResponse.json({ error: "Not your order" }, { status: 403 });
    }
  }

  // A merchant is only ever billed once an order is DELIVERED (see
  // markOrderDelivered), so nothing has actually been charged yet at
  // PENDING/ASSIGNED — no refund owed, just a straight cancellation.
  const ok = cancelOrder(params.id, auth.id, parsed.data.reason, { wasCharged: false });
  if (!ok) {
    return NextResponse.json(
      { error: "This order can no longer be cancelled — it's already been picked up." },
      { status: 409 }
    );
  }

  const updated = getOrderById(params.id);
  if (updated) {
    const merchantProfile = updated.merchantId ? getMerchantProfileById(updated.merchantId) : null;
    const merchantUser = merchantProfile ? findUserById(merchantProfile.userId) : null;
    await notifyCancelled(updated as any, merchantUser?.email ?? null, parsed.data.reason);
  }

  return NextResponse.json({ ok: true });
}
