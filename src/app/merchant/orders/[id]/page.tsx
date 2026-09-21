import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getMerchantProfileByUserId, getOrderById } from "@/lib/repo";
import TrackingLive from "@/components/TrackingLive";

/** Merchant's live view of one of their own orders — same live map + status
 * timeline as the public customer tracking page, reused here. */
export default async function MerchantOrderDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== "MERCHANT") redirect("/login");

  const merchant = getMerchantProfileByUserId(user.id);
  const order = getOrderById(params.id);
  if (!order || !merchant || order.merchantId !== merchant.id) notFound();

  return <TrackingLive orderId={order.id} initialOrder={order as any} showRating={false} />;
}
