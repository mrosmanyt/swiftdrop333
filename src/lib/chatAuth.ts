import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getCourierProfileByUserId, getMerchantProfileByUserId, getOrderById } from "@/lib/repo";

/**
 * Shared access check for an order's chat thread — used by both the
 * messages route and the typing-signal route, so the two can't drift out
 * of sync on who's allowed to read/write a given thread.
 *
 * The customer is authenticated by possession of the order id (their
 * private tracking link); courier and merchant must be signed in and
 * attached to this order.
 */
export async function resolveSender(orderId: string) {
  const order = getOrderById(orderId);
  if (!order) return { error: NextResponse.json({ error: "Order not found" }, { status: 404 }) };

  const user = await getSessionUser();
  if (!user) return { order, role: "customer" as const, userId: null };

  if (user.role === "COURIER") {
    const courier = getCourierProfileByUserId(user.id);
    if (courier && order.courierId === courier.id) {
      return { order, role: "courier" as const, userId: user.id };
    }
    return { error: NextResponse.json({ error: "Not your delivery" }, { status: 403 }) };
  }

  if (user.role === "MERCHANT") {
    const merchant = getMerchantProfileByUserId(user.id);
    if (merchant && order.merchantId === merchant.id) {
      return { order, role: "merchant" as const, userId: user.id };
    }
    return { error: NextResponse.json({ error: "Not your delivery" }, { status: 403 }) };
  }

  if (user.role === "ADMIN") return { order, role: "admin" as const, userId: user.id };

  return { order, role: "customer" as const, userId: null };
}
