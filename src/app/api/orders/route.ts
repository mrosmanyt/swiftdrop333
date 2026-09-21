import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import {
  createOrder,
  getMerchantProfileByUserId,
  getZoneById,
  listOrdersForMerchant,
  listAllOrders,
  listActiveOrdersForCourier,
  listDeliveredOrdersForCourier,
  getCourierProfileByUserId,
} from "@/lib/repo";
import { computeOrderPrice } from "@/lib/pricing";
import { merchantBlockReason } from "@/lib/guards";
import { routeBetween } from "@/lib/geo";
import { runDispatchTick } from "@/lib/dispatch";

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

  // ADMIN
  return NextResponse.json({ orders: listAllOrders() });
}

// POST /api/orders — merchant creates a new delivery order. merchantId is
// always derived from the signed-in session, never trusted from the body.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "MERCHANT") {
    return NextResponse.json({ error: "Only merchants can create orders" }, { status: 403 });
  }

  const merchant = getMerchantProfileByUserId(user.id);
  const blocked = merchantBlockReason(merchant);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 403 });

  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const zone = getZoneById(input.zoneId);
  if (!zone || !zone.isActive) {
    return NextResponse.json({ error: "Unknown or inactive zone" }, { status: 400 });
  }

  // Real road distance when we have coordinates (from address autocomplete)
  // and the routing service is reachable; a detour-adjusted straight line
  // otherwise; a flat estimate only if the addresses were never geocoded.
  let distanceKm = 3;
  let distanceSource = "flat-estimate";
  let etaMinutes: number | null = null;

  if (input.pickupLat && input.pickupLng && input.dropoffLat && input.dropoffLng) {
    const route = await routeBetween(
      { lat: input.pickupLat, lng: input.pickupLng },
      { lat: input.dropoffLat, lng: input.dropoffLng }
    );
    distanceKm = route.distanceKm;
    distanceSource = route.source;
    etaMinutes = route.durationMin;
  }

  const { priceCents, courierFeeCents, platformFeeCents } = computeOrderPrice({
    baseRateCents: zone.baseRateCents,
    perKmCents: zone.perKmCents,
    distanceKm,
    serviceType: input.serviceType,
  });

  const orderId = createOrder({
    merchantId: merchant!.id,
    zoneId: input.zoneId,
    pickupAddress: input.pickupAddress,
    pickupLat: input.pickupLat ?? null,
    pickupLng: input.pickupLng ?? null,
    dropoffAddress: input.dropoffAddress,
    dropoffLat: input.dropoffLat ?? null,
    dropoffLng: input.dropoffLng ?? null,
    customerName: input.customerName,
    customerPhone: input.customerPhone ?? null,
    customerEmail: input.customerEmail || null,
    deliveryInstructions: input.deliveryInstructions ?? null,
    packageWeightKg: input.packageWeightKg ?? null,
    serviceType: input.serviceType,
    priceCents,
    courierFeeCents,
    platformFeeCents,
    windowStart: input.windowStart ?? null,
    windowEnd: input.windowEnd ?? null,
    distanceKm,
    distanceSource,
    etaMinutes,
  });

  // Offer it to the best available courier straight away.
  runDispatchTick();

  return NextResponse.json({ orderId }, { status: 201 });
}
