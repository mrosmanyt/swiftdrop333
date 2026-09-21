import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import {
  getMerchantProfileByUserId,
  listOrdersForMerchant,
  listAllOrders,
  listActiveOrdersForCourier,
  listDeliveredOrdersForCourier,
  getCourierProfileByUserId,
} from "@/lib/repo";
import { merchantBlockReason } from "@/lib/guards";
import { createAndDispatchOrder } from "@/lib/orders";

const createOrderSchema = z.object({
  zoneId: z.string(),
  pickupAddress: z.string().min(3),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffAddress: z.string().min(3),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  deliveryInstructions: z.string().optional(),
  packageWeightKg: z.number().optional(),
  serviceType: z.enum(["NEXT_DAY", "SAME_DAY", "DIRECT", "BATCH"]).default("SAME_DAY"),
  windowStart: z.string().optional(), // ISO datetime — earliest delivery
  windowEnd: z.string().optional(), // ISO datetime — promised by
  // Compliance flags (alcohol/pharmacy, cold chain)
  requiresAgeVerification: z.boolean().optional(),
  temperatureRequirement: z.enum(["ambient", "cold", "frozen"]).optional(),
});

// GET /api/orders — scoped by role: merchant sees their own, courier sees
// their active + delivered, admin sees everything.
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view"); // "active" | "delivered" (courier only)

  if (user.role === "MERCHANT") {
    const merchant = getMerchantProfileByUserId(user.id);
    if (!merchant) return NextResponse.json({ orders: [] });
    return NextResponse.json({ orders: listOrdersForMerchant(merchant.id) });
  }

  if (user.role === "COURIER") {
    const courier = getCourierProfileByUserId(user.id);
    if (!courier) return NextResponse.json({ orders: [] });
    const orders =
      view === "delivered"
        ? listDeliveredOrdersForCourier(courier.id)
        : listActiveOrdersForCourier(courier.id);
    return NextResponse.json({ orders });
  }

  return NextResponse.json({ orders: listAllOrders() });
}

/**
 * POST /api/orders — merchant creates a delivery from the portal.
 *
 * merchantId always comes from the session, never the request body. All
 * the real work (pricing with surge, road distance, dispatch, customer
 * notifications, merchant webhooks) lives in createAndDispatchOrder so the
 * portal, CSV import, public API and recurring schedules behave identically.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "MERCHANT") {
    return NextResponse.json({ error: "Only merchants can create orders" }, { status: 403 });
  }

  const merchant = getMerchantProfileByUserId(user.id);
  const blocked = merchantBlockReason(merchant);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 403 });

  const parsed = createOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await createAndDispatchOrder({
      ...parsed.data,
      customerEmail: parsed.data.customerEmail || null,
      merchantId: merchant!.id,
      source: "portal",
    } as any);

    return NextResponse.json({ orderId: result.orderId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 400 });
  }
}
