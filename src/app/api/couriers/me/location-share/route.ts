import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { createLocationShare, getCourierProfileByUserId } from "@/lib/repo";

/** POST /api/couriers/me/location-share — generate a fresh 60-minute "watch my live location" link to text an emergency contact. */
export async function POST() {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 404 });

  const { token, expiresAt } = createLocationShare(courier.id, 60);
  return NextResponse.json({ token, expiresAt }, { status: 201 });
}
