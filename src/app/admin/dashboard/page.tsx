import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { countMerchants, countCouriers, countOnlineCouriers, orderStatusCounts } from "@/lib/repo";
import AutoRefresh from "@/components/AutoRefresh";

export default async function AdminOverviewPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const merchantCount = countMerchants();
  const courierCount = countCouriers();
  const onlineCouriers = countOnlineCouriers();
  const orderCounts = orderStatusCounts();

  const totalOrders = orderCounts.reduce((sum, r) => sum + r.count, 0);
  const delivered = orderCounts.find((r) => r.status === "DELIVERED")?.count ?? 0;
  const completionRate = totalOrders ? ((delivered / totalOrders) * 100).toFixed(1) : "—";

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={8000} />
      <h1 className="text-2xl font-bold">Ops Overview</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Merchants" value={merchantCount} />
        <Stat label="Couriers" value={courierCount} />
        <Stat label="Online now" value={onlineCouriers} highlight />
        <Stat label="Total orders" value={totalOrders} />
        <Stat label="Completion rate" value={`${completionRate}%`} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Orders by status</h2>
        <ul className="space-y-1 text-sm">
          {orderCounts.map((r) => (
            <li key={r.status} className="flex justify-between border-b border-gray-50 py-1">
              <span>{r.status}</span>
              <span className="font-medium">{r.count}</span>
            </li>
          ))}
          {!orderCounts.length && <li className="text-gray-400">No orders yet.</li>}
        </ul>
      </div>

      <p className="text-xs text-gray-400">
        See <a href="/admin/live-map" className="text-brand hover:underline">Live Map</a> for every
        in-flight delivery's courier position in real time.
      </p>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${highlight ? "text-green-700" : ""}`}>{value}</p>
    </div>
  );
}
