import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { getOrderById } from "@/lib/repo";
import { savePushSubscription } from "@/lib/push";

const schema = z.object({
  subscription: z.object({
    endpoint: z.string().min(1),
    keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  }),
  // Only used for a guest customer on the tracking page — a signed-in user
  // is always subscribed against their own account instead (see below).
  orderId: z.string().optional(),
});

/**
 * POST /api/push/subscribe — register a browser's push subscription.
 *
 * Signed-in users (driver/merchant/admin) are subscribed against their
 * account, so a new offer or status change reaches every device they've
 * opted in on. A guest customer has no account, so their subscription is
 * keyed to the one order they're tracking instead — that's the only thing
 * they should ever receive a push about.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const user = await getSessionUser();
  if (user) {
    savePushSubscription("user", user.id, parsed.data.subscription);
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.orderId) {
    const order = getOrderById(parsed.data.orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    savePushSubscription("order", order.id, parsed.data.subscription);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Sign in, or subscribe from a tracking page." }, { status: 400 });
}
