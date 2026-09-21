import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { demandByHour, demandHeatmap } from "@/lib/repo";

/**
 * GET /api/couriers/me/heatmap — where and when the work is.
 * Zones ranked by orders waiting, plus busiest hours over the last week,
 * so couriers can position themselves instead of guessing (and the
 * platform needs fewer bonuses to pull supply where it's short).
 */
export async function GET() {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    zones: demandHeatmap(24),
    byHour: demandByHour(7),
  });
}
