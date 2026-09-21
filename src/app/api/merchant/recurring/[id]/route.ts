import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { getMerchantProfileByUserId, setRecurringActive } from "@/lib/repo";

const schema = z.object({ active: z.boolean() });

// PATCH /api/merchant/recurring/:id — pause or resume a standing schedule.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("MERCHANT");
  if (auth instanceof NextResponse) return auth;

  const merchant = getMerchantProfileByUserId(auth.id);
  if (!merchant) return NextResponse.json({ error: "No merchant profile" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ok = setRecurringActive(params.id, merchant.id, parsed.data.active);
  if (!ok) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
