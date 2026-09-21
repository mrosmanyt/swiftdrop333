import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { markOrderPickedUp, getCourierProfileByUserId } from "@/lib/repo";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });

  const ok = markOrderPickedUp(params.id, courier.id);
  if (!ok) return NextResponse.json({ error: "Order not found or not yours" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
