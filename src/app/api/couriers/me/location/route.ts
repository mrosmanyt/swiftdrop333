import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { getCourierProfileByUserId, updateCourierLocation, listActiveOrdersForCourier } from "@/lib/repo";
import { checkLocationJump } from "@/lib/fraud";

const schema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * POST /api/couriers/me/location — the driver app calls this every ~5-10s
 * while online (see components/LocationBroadcaster.tsx). This is the real,
 * live location feed that the customer tracking page, the merchant order
 * view, and the admin live ops map all read from.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 404 });

  // Tag the ping with the courier's current active order, if any, so the
  // route trail can be replayed per-delivery later.
  const active = listActiveOrdersForCourier(courier.id);
  const activeOrderId = active[0]?.id ?? null;

  // GPS spoofing check runs against the previous ping, before this one
  // overwrites it.
  checkLocationJump(courier.id, parsed.data.lat, parsed.data.lng);

  updateCourierLocation(courier.id, parsed.data.lat, parsed.data.lng, activeOrderId);
  return NextResponse.json({ ok: true });
}
