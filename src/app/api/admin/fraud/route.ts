import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { listFraudFlags, resolveFraudFlag } from "@/lib/fraud";

export async function GET(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const status = new URL(req.url).searchParams.get("status") ?? "open";
  return NextResponse.json({ flags: listFraudFlags(status) });
}

const schema = z.object({
  flagId: z.string(),
  status: z.enum(["reviewed", "dismissed"]),
});

// PATCH /api/admin/fraud — close out a flag after a human looks at it.
export async function PATCH(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ok = resolveFraudFlag(parsed.data.flagId, parsed.data.status, auth.id);
  if (!ok) return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
