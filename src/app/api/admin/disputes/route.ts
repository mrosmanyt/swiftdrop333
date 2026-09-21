import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { listDisputes, resolveDispute } from "@/lib/repo";

export async function GET(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  return NextResponse.json({ disputes: listDisputes(status) });
}

const schema = z.object({
  disputeId: z.string(),
  status: z.enum(["resolved", "rejected"]),
  resolution: z.string().min(3).max(1000),
  resolutionAmountCents: z.number().int().nonnegative().optional(),
});

/** PATCH /api/admin/disputes — settle a claim, optionally with a refund
 *  or credit amount recorded against it. */
export async function PATCH(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ok = resolveDispute({ ...parsed.data, adminUserId: auth.id });
  if (!ok) return NextResponse.json({ error: "Dispute not found or already settled" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
