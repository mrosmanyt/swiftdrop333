import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import {
  addMessage,
  getCourierProfileByUserId,
  getMerchantProfileByUserId,
  getOrderById,
  listMessages,
} from "@/lib/repo";
import { notifyNewMessage } from "@/lib/notify";

/**
 * Chat thread for one delivery — courier ↔ customer, with the merchant
 * able to see it too.
 *
 * The privacy point: neither side ever sees the other's phone number. The
 * courier asks "which buzzer?" here instead of calling, and the customer
 * replies from the tracking link with no account. (For actual masked
 * voice calls you'd add Twilio Proxy on top of this — the chat covers the
 * common case without any telephony cost.)
 *
 * Access: the customer is authenticated by possession of the order id
 * (their private tracking link); courier and merchant must be signed in
 * and attached to this order.
 */

async function resolveSender(orderId: string) {
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

// GET /api/orders/:id/messages — the thread.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const resolved = await resolveSender(params.id);
  if ("error" in resolved && resolved.error) return resolved.error;

  return NextResponse.json({ messages: listMessages(params.id), you: resolved.role });
}

const schema = z.object({ body: z.string().min(1).max(2000) });

// POST /api/orders/:id/messages — send a message into the thread.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const resolved = await resolveSender(params.id);
  if ("error" in resolved && resolved.error) return resolved.error;
  const { order, role, userId } = resolved as any;

  // Once a delivery is finished and returned/closed, stop the thread.
  if (["RETURNED", "CANCELLED"].includes(order.status)) {
    return NextResponse.json({ error: "This delivery is closed." }, { status: 409 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  addMessage({ orderId: params.id, senderRole: role, senderUserId: userId, body: parsed.data.body });

  // Nudge the customer by SMS when someone else writes to them.
  if (role !== "customer") {
    await notifyNewMessage(order, role, parsed.data.body.slice(0, 60));
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
