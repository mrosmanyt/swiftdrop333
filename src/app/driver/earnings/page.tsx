import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getCourierProfileByUserId, listDeliveredOrdersForCourier, computeCourierStats14d } from "@/lib/repo";
import { TIER_BONUS_CENTS, nextTierProgress } from "@/lib/pricing";

export default async function DriverEarningsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "COURIER") redirect("/login");

  const courier = getCourierProfileByUserId(user.id);
  if (!courier) return <p>No courier profile found.</p>;

  const delivered = listDeliveredOrdersForCourier(courier.id, 200);
  const total = delivered.reduce((sum, o) => sum + (o!.courierFeeCents ?? 0), 0);
  const stats = computeCourierStats14d(courier.id);
  const progress = nextTierProgress(stats);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Earnings</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-400">Total earned (all time)</p>
          <p className="mt-1 text-2xl font-semibold">${(total / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-400">Deliveries completed</p>
          <p className="mt-1 text-2xl font-semibold">{delivered.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-brand-light bg-brand-light/30 p-4">
        <p className="font-medium text-brand-dark">
          Current tier: {courier.tier} (+{TIER_BONUS_CENTS[courier.tier]}¢/delivery)
        </p>
        <p className="mt-1 text-sm text-gray-600">{progress.message}</p>
        <p className="mt-1 text-xs text-gray-400">
          Last 14 days: {stats.deliveries} deliveries · {Math.round(stats.completionRate * 100)}% completion rate
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4 font-semibold">Recent deliveries</div>
        <table className="w-full text-left text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="p-3">Delivered</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Earned</th>
              <th className="p-3">Rating</th>
            </tr>
          </thead>
          <tbody>
            {delivered.slice(0, 15).map((o) => (
              <tr key={o!.id} className="border-t border-gray-100">
                <td className="p-3">{o!.deliveredAt ? new Date(o!.deliveredAt).toLocaleDateString() : "—"}</td>
                <td className="p-3">{o!.customerName}</td>
                <td className="p-3">${(o!.courierFeeCents / 100).toFixed(2)}</td>
                <td className="p-3">{o!.customerRating ? `${o!.customerRating}★` : "—"}</td>
              </tr>
            ))}
            {!delivered.length && (
              <tr>
                <td className="p-3 text-gray-400" colSpan={4}>
                  No deliveries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
