import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitOrderRating } from "@/lib/repo";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// POST /api/orders/:id/rate — public (no login), called from the customer
// tracking page after delivery. Same "order id = access key" model as GET.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ok = submitOrderRating(params.id, parsed.data.rating, parsed.data.comment);
  if (!ok) {
    return NextResponse.json(
      { error: "Order not found, not yet delivered, or already rated." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
