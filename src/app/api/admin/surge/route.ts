import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { setZoneSurge, listAllZones } from "@/lib/repo";

const schema = z.object({
  zoneId: z.string(),
  multiplier: z.number().min(1).max(3),
  note: z.string().max(200).optional(),
});

// GET /api/admin/surge — current multipliers per zone.
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ zones: listAllZones() });
}

/**
 * POST /api/admin/surge — raise (or clear) demand pricing for a zone.
 * Capped at 3x deliberately: uncapped surge is what gets delivery
 * platforms into the news for the wrong reasons.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  setZoneSurge(parsed.data.zoneId, parsed.data.multiplier, parsed.data.note ?? null, auth.id);
  return NextResponse.json({ ok: true });
}
