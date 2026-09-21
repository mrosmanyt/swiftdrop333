import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { markOrderReturned, getCourierProfileByUserId } from "@/lib/repo";

// POST /api/orders/:id/returned — courier confirms the parcel is back with
// the merchant, closing the loop on a failed delivery.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });

  const ok = markOrderReturned(params.id, courier.id);
  if (!ok) return NextResponse.json({ error: "Order not found or not being returned" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
