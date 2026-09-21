import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { searchAddress } from "@/lib/geo";

/**
 * GET /api/geocode?q=...&lat=&lng=
 * Server-side proxy for address autocomplete: keeps any provider API key
 * off the client, adds the User-Agent that OSM services ask for, and lets
 * us swap providers without touching the UI.
 *
 * Sign-in required so the endpoint can't be used as a free public
 * geocoding proxy.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const bias = lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined;
  const { suggestions, degraded } = await searchAddress(q, bias);

  return NextResponse.json({ suggestions, degraded });
}
