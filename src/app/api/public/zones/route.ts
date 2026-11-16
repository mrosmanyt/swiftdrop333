import { NextRequest, NextResponse } from "next/server";
import { clientIp, hit } from "@/lib/rateLimit";
import { listActiveZones } from "@/lib/repo";
import { serviceCityFor } from "@/lib/site/canada";
import { STANDARD_RATE, type RateArea } from "@/lib/site/zones";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/zones?lat=..&lng=.. — which service city a pickup point
 * is in, and the live rates for that city (admin → Zones & pricing). The
 * calculator in the browser turns these into per-zone prices with the same
 * pricing engine used for real orders.
 */
export async function GET(req: NextRequest) {
  if (!hit(`pubzones:${clientIp(req.headers)}`, 60, 60_000).ok) {
    return NextResponse.json({ error: "Too many requests — try again in a minute." }, { status: 429 });
  }
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Missing location." }, { status: 400 });
  }

  const city = serviceCityFor(lat, lng);
  if (!city) return NextResponse.json({ city: null, areas: [] });

  let areas: RateArea[] = [];
  try {
    areas = (await listActiveZones())
      .filter((z) => z && z.city.trim().toLowerCase() === city.name.toLowerCase())
      .map((z) => ({
        id: z!.id,
        name: z!.name,
        baseRateCents: z!.baseRateCents,
        perKmCents: z!.perKmCents,
        surgeMultiplier: Number(z!.surgeMultiplier) || 1,
      }));
  } catch (e) {
    console.error("[zones] could not load rates", e);
  }
  if (!areas.length) {
    areas = [{ id: "standard", name: "Standard rate", ...STANDARD_RATE, surgeMultiplier: 1, standard: true }];
  }
  return NextResponse.json({ city: { name: city.name, province: city.province, lat: city.lat, lng: city.lng, radiusKm: city.radiusKm }, areas });
}
