import { NextRequest, NextResponse } from "next/server";
import { getOrderById, getCourierLocationTrail, canViewFullOrder, toPublicOrder } from "@/lib/repo";
import { getSessionUser } from "@/lib/session";

/**
 * GET /api/orders/:id — powers the no-login customer tracking page, the
 * merchant order-detail view, and the admin view. Like Trexity's own
 * tracking links, knowing the order id is the access key here — there's no
 * login wall on this endpoint by design. It includes the assigned courier's
 * live lat/lng while the order is active, which is what the tracking page's
 * live map renders.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const showLocation = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(order.status);
  const trail = showLocation && order.courierId ? await getCourierLocationTrail(order.courierId, order.id) : [];

  // The merchant who owns it, its courier and admins get the full record;
  // anyone else holding the tracking link gets only what the tracking page
  // renders (see toPublicOrder) — no phone numbers, emails, fees or notes.
  const viewer = await getSessionUser();
  const full = await canViewFullOrder(viewer, order);

  return NextResponse.json({
    order: full ? order : toPublicOrder(order),
    courierLocation:
      showLocation && order.courierLastLat != null
        ? { lat: order.courierLastLat, lng: order.courierLastLng, at: order.courierLastLocationAt }
        : null,
    trail,
  });
}
