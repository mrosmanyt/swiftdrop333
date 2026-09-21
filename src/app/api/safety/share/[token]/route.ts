import { NextRequest, NextResponse } from "next/server";
import { getActiveLocationShare, getCourierProfileById } from "@/lib/repo";

/**
 * GET /api/safety/share/:token — public, no login. Whoever holds this
 * link (the courier's emergency contact) can see where they are right
 * now, same trust model as the customer tracking link: possession of the
 * unguessable token is the access control.
 */
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const share = getActiveLocationShare(params.token);
  if (!share) return NextResponse.json({ error: "This link has expired or doesn't exist." }, { status: 404 });

  const courier = getCourierProfileById(share.courierId);
  if (!courier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    // First name only — an emergency contact needs "is this really them
    // and are they okay", not the courier's full legal name.
    firstName: courier.fullName?.split(" ")[0] ?? "Courier",
    vehicleType: courier.vehicleType,
    lat: courier.lastLat,
    lng: courier.lastLng,
    lastLocationAt: courier.lastLocationAt,
    expiresAt: share.expiresAt,
  });
}
