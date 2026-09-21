import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { createZone, listActiveZones, listAllZones } from "@/lib/repo";

// GET /api/zones — public: merchants need this to show the rate card
// (blueprint differentiator #3 — transparent published pricing).
// Pass ?all=true (admin only) to include inactive zones too.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("all") === "true") {
    const auth = await requireRole("ADMIN");
    if (auth instanceof NextResponse) return auth;
    return NextResponse.json({ zones: listAllZones() });
  }
  return NextResponse.json({ zones: listActiveZones() });
}

const createZoneSchema = z.object({
  city: z.string().min(1),
  name: z.string().min(1),
  baseRateCents: z.number().int().positive(),
  perKmCents: z.number().int().nonnegative().default(0),
});

// POST /api/zones — Admin only: add a new pricing zone (launching a new city
// becomes a config change here, not a rebuild — blueprint §12 Phase 3).
export async function POST(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = createZoneSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const zoneId = createZone(parsed.data);
  return NextResponse.json({ zoneId }, { status: 201 });
}
