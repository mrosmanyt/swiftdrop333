import { getOrderById } from "@/lib/repo";
import TrackingLive from "@/components/TrackingLive";

/**
 * No-login customer tracking page — blueprint §6, now with a real live map
 * of the courier's position (polling every 4s via TrackingLive) instead of
 * a static status list.
 */
export default async function TrackOrderPage({ params }: { params: { orderId: string } }) {
  const order = getOrderById(params.orderId);

  if (!order) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Delivery not found</h1>
        <p className="mt-2 text-gray-500">
          This is a real tracking link — create an order first from the Merchant Portal, then
          visit /track/&lt;order-id&gt; (shown after creating a delivery).
        </p>
      </main>
    );
  }

  return (
    <main>
      <TrackingLive orderId={order.id} initialOrder={order as any} />
    </main>
  );
}
