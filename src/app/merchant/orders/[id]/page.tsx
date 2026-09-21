import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getMerchantProfileByUserId, getOrderById } from "@/lib/repo";
import TrackingLive from "@/components/TrackingLive";
import CancelOrderButton from "@/components/CancelOrderButton";

/** Merchant's live view of one of their own orders — same live map + status
 * timeline as the public customer tracking page, reused here. */
export default async function MerchantOrderDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== "MERCHANT") redirect("/login");

  const merchant = getMerchantProfileByUserId(user.id);
  const order = getOrderById(params.id);
  if (!order || !merchant || order.merchantId !== merchant.id) notFound();

  const cancellable = ["PENDING", "ASSIGNED"].includes(order.status);

  return (
    <div className="space-y-4">
      {cancellable && (
        <div className="flex justify-end">
          <CancelOrderButton orderId={order.id} />
        </div>
      )}
      {order.status === "CANCELLED" && (
        <div className="rounded-xl border border-danger/30 bg-danger-soft/40 p-3.5 text-[13px] text-fg">
          This delivery was cancelled{order.cancelReason ? `: ${order.cancelReason}` : "."}
          {order.refundStatus !== "none" && (
            <span className="ml-1 text-fg-muted">
              Refund status: <span className="font-medium">{order.refundStatus}</span>.
            </span>
          )}
        </div>
      )}
      <TrackingLive orderId={order.id} initialOrder={order as any} showRating={false} />
    </div>
  );
}
