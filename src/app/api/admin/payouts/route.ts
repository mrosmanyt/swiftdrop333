import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { listPayoutRequests, setPayoutStatus } from "@/lib/repo";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ requests: listPayoutRequests() });
}

const schema = z.object({
  requestId: z.string(),
  status: z.enum(["approved", "paid", "rejected"]),
  note: z.string().max(500).optional(),
});

// PATCH /api/admin/payouts — move a payout request along. Until a payment
// provider is connected, "paid" means an admin sent the money manually.
export async function PATCH(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ok = setPayoutStatus(parsed.data.requestId, parsed.data.status, auth.id, parsed.data.note);
  if (!ok) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
