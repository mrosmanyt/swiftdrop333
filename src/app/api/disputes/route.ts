import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import {
  createDispute,
  getCourierProfileByUserId,
  getMerchantProfileByUserId,
  getOrderById,
} from "@/lib/repo";

const schema = z.object({
  orderId: z.string(),
  reason: z.string().min(5).max(1000),
});

/**
 * POST /api/disputes — raise a claim on a delivery (damaged, missing,
 * late). Open to the merchant, the assigned courier, and the customer via
 * their tracking link.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const order = getOrderById(parsed.data.orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const user = await getSessionUser();
  let raisedBy: string = "customer";

  if (user?.role === "MERCHANT") {
    const merchant = getMerchantProfileByUserId(user.id);
    if (!merchant || order.merchantId !== merchant.id) {
      return NextResponse.json({ error: "Not your delivery" }, { status: 403 });
    }
    raisedBy = "merchant";
  } else if (user?.role === "COURIER") {
    const courier = getCourierProfileByUserId(user.id);
    if (!courier || order.courierId !== courier.id) {
      return NextResponse.json({ error: "Not your delivery" }, { status: 403 });
    }
    raisedBy = "courier";
  } else if (user?.role === "ADMIN") {
    raisedBy = "admin";
  }

  const disputeId = createDispute({
    orderId: order.id,
    raisedBy,
    reason: parsed.data.reason,
    orderAmountCents: order.priceCents,
  });

  return NextResponse.json({ disputeId }, { status: 201 });
}
