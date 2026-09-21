import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/apiAuth";
import { getOrderById } from "@/lib/repo";

// GET /api/v1/orders/:id — order status for the merchant's own system.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const caller = authenticateApiRequest(req);
  if (!caller) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  const order = getOrderById(params.id);
  if (!order || order.merchantId !== caller.merchantId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    customerName: order.customerName,
    dropoffAddress: order.dropoffAddress,
    priceCents: order.priceCents,
    courierLocation:
      ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(order.status) && order.courierLastLat != null
        ? { lat: order.courierLastLat, lng: order.courierLastLng, at: order.courierLastLocationAt }
        : null,
    proofOfDeliveryUrl: order.proofOfDeliveryUrl,
    trackingUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/track/${order.id}`,
  });
}
