import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { markOrderReturning, getCourierProfileByUserId } from "@/lib/repo";

const schema = z.object({ reason: z.string().min(1).max(500) });

/**
 * POST /api/orders/:id/returning — delivery couldn't be completed
 * (customer not home, wrong address, refused). The parcel isn't just
 * "failed" and forgotten: the order moves to RETURNING and the courier is
 * expected to bring it back to the merchant.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });

  const ok = markOrderReturning(params.id, courier.id, parsed.data.reason);
  if (!ok) return NextResponse.json({ error: "Order not found or not in a returnable state" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
