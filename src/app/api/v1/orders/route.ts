import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApiRequest } from "@/lib/apiAuth";
import { createAndDispatchOrder } from "@/lib/orders";
import { listOrdersForMerchant, listActiveZones } from "@/lib/repo";

/**
 * Public merchant API v1.
 *
 *   curl -X POST https://your-domain.ca/api/v1/orders \
 *     -H "Authorization: Bearer sk_live_..." \
 *     -H "Content-Type: application/json" \
 *     -d '{"zoneId":"...","pickupAddress":"...","dropoffAddress":"...","customerName":"..."}'
 *
 * This is what a merchant's own system (or a Shopify app) calls to create
 * deliveries automatically. Same pricing, dispatch and notifications as
 * the portal — it goes through the shared createAndDispatchOrder path.
 */

const schema = z.object({
  zoneId: z.string().optional(),
  pickupAddress: z.string().min(3),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffAddress: z.string().min(3),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  deliveryInstructions: z.string().optional(),
  serviceType: z.enum(["NEXT_DAY", "SAME_DAY", "DIRECT", "BATCH"]).default("SAME_DAY"),
  windowStart: z.string().optional(),
  windowEnd: z.string().optional(),
  externalId: z.string().optional(), // merchant's own order reference
});

export async function GET(req: NextRequest) {
  const caller = authenticateApiRequest(req);
  if (!caller) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  const orders = listOrdersForMerchant(caller.merchantId, 100).map((o) => ({
    id: o!.id,
    status: o!.status,
    customerName: o!.customerName,
    dropoffAddress: o!.dropoffAddress,
    priceCents: o!.priceCents,
    createdAt: o!.createdAt,
    deliveredAt: o!.deliveredAt,
  }));
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const caller = authenticateApiRequest(req);
  if (!caller) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Zone is optional over the API — fall back to the first active zone so
  // simple integrations don't have to know about zones at all.
  const zoneId = parsed.data.zoneId ?? listActiveZones()[0]?.id;
  if (!zoneId) return NextResponse.json({ error: "No active delivery zones" }, { status: 400 });

  try {
    const result = await createAndDispatchOrder({
      ...parsed.data,
      zoneId,
      merchantId: caller.merchantId,
      source: "api",
    } as any);

    return NextResponse.json(
      {
        id: result.orderId,
        priceCents: result.priceCents,
        trackingUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/track/${result.orderId}`,
      },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 400 });
  }
}
