import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { submitMerchantRating, getCourierProfileByUserId } from "@/lib/repo";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/**
 * POST /api/orders/:id/rate-merchant — the other half of two-way ratings.
 * The courier rates the merchant (pickup wait, packaging, staff). Trexity
 * doesn't do this; it's how you find the merchants who are burning courier
 * time and fix them before it costs you couriers.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });

  const ok = submitMerchantRating(params.id, courier.id, parsed.data.rating, parsed.data.comment);
  if (!ok) {
    return NextResponse.json(
      { error: "Not your delivery, already rated, or not picked up yet." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
