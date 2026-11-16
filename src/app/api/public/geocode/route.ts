import { NextRequest, NextResponse } from "next/server";
import { clientIp, hit } from "@/lib/rateLimit";
import { searchAddress } from "@/lib/geo";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/geocode?q=... — Canadian address suggestions for the two
 * public screens that need them before anyone has an account: the business
 * sign-up form and the zone price calculator.
 *
 * /api/geocode stays sign-in only. This one is open, so it is tightly
 * rate-limited per visitor to stop it being used as a free geocoding proxy.
 */
export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!hit(`pubgeo:${ip}`, 40, 60_000).ok || !hit(`pubgeo:day:${ip}`, 600, 24 * 60 * 60 * 1000).ok) {
    return NextResponse.json({ suggestions: [], degraded: true, error: "Too many searches — try again in a minute." }, { status: 429 });
  }
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 120);
  const { suggestions, degraded } = await searchAddress(q);
  return NextResponse.json({ suggestions, degraded }, { headers: { "Cache-Control": "private, max-age=60" } });
}
