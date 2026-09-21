import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addMessage, getReadState, listMessages, markMessagesRead } from "@/lib/repo";
import { notifyNewMessage } from "@/lib/notify";
import { whoIsTyping } from "@/lib/typing";
import { resolveSender } from "@/lib/chatAuth";

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

// GET /api/orders/:id/messages — the thread. Fetching it IS reading it, so
// this also stamps the requester's read state and returns who else is
// currently typing — the poll loop that already exists in OrderChat.tsx is
// enough to drive both "seen" ticks and a typing indicator without any new
// live-connection infrastructure.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const resolved = await resolveSender(params.id);
  if ("error" in resolved && resolved.error) return resolved.error;
  const { role } = resolved as any;

  markMessagesRead(params.id, role);

  return NextResponse.json({
    messages: listMessages(params.id),
    you: role,
    readState: getReadState(params.id),
    typing: whoIsTyping(params.id, role),
  });
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

  // Sending a message also means you've read up to now.
  markMessagesRead(params.id, role);

  // Nudge the customer by SMS when someone else writes to them.
  if (role !== "customer") {
    await notifyNewMessage(order, role, parsed.data.body.slice(0, 60));
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
