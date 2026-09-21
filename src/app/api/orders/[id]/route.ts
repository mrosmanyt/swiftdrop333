import { NextRequest, NextResponse } from "next/server";
import { getOrderById, getCourierLocationTrail } from "@/lib/repo";

/**
 * GET /api/orders/:id — powers the no-login customer tracking page, the
 * merchant order-detail view, and the admin view. Like Trexity's own
 * tracking links, knowing the order id is the access key here — there's no
 * login wall on this endpoint by design. It includes the assigned courier's
 * live lat/lng while the order is active, which is what the tracking page's
 * live map renders.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const order = getOrderById(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const showLocation = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(order.status);
  const trail = showLocation && order.courierId ? getCourierLocationTrail(order.courierId, order.id) : [];

  return NextResponse.json({
    order,
    courierLocation:
      showLocation && order.courierLastLat != null
        ? { lat: order.courierLastLat, lng: order.courierLastLng, at: order.courierLastLocationAt }
        : null,
    trail,
  });
}
