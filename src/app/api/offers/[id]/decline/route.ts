import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { declineOffer, getCourierProfileByUserId } from "@/lib/repo";
import { runDispatchTick } from "@/lib/dispatch";

/**
 * POST /api/offers/:id/decline — courier passes on an offer. The order is
 * immediately re-dispatched to the next best courier rather than waiting
 * for the timer to run out.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });

  const ok = declineOffer(params.id, courier.id);
  if (!ok) return NextResponse.json({ error: "Offer not found or already resolved" }, { status: 404 });

  runDispatchTick();
  return NextResponse.json({ ok: true });
}
