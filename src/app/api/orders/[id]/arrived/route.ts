import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { markArrivedAtPickup, getCourierProfileByUserId } from "@/lib/repo";

/**
 * POST /api/orders/:id/arrived — courier taps this when they reach the
 * merchant. The gap between this and the actual pickup is the merchant's
 * wait time, which feeds their pickup-performance score.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });

  const ok = markArrivedAtPickup(params.id, courier.id);
  if (!ok) return NextResponse.json({ error: "Already recorded or not your delivery" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
