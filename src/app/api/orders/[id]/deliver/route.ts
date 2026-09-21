import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { markOrderDelivered, getCourierProfileByUserId } from "@/lib/repo";

const schema = z.object({ proofOfDeliveryUrl: z.string().min(1) });

// POST /api/orders/:id/deliver — courier confirms delivery with a photo URL
// (upload the photo first via POST /api/upload, then call this with the URL).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });

  const ok = markOrderDelivered(params.id, courier.id, parsed.data.proofOfDeliveryUrl);
  if (!ok) return NextResponse.json({ error: "Order not found or not yours" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
