import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { setOrderRefund, getOrderById } from "@/lib/repo";

const schema = z.object({
  status: z.enum(["refunded", "denied"]),
  amountCents: z.number().int().min(0).optional(),
  note: z.string().max(500).optional(),
});

// POST /api/admin/orders/:id/refund — settle a refund owed on a cancelled
// (or otherwise problem) order. Admin-only, since real money leaves the
// platform here.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const order = getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const ok = setOrderRefund(params.id, auth.id, parsed.data.status, parsed.data.amountCents, parsed.data.note);
  if (!ok) return NextResponse.json({ error: "Could not update refund" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
