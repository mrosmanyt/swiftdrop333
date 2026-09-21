import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listAllOrders, listCouriers } from "@/lib/repo";
import { ORDER_STATUS_LABEL, OrderStatus } from "@/lib/types";
import AdminOrderActions from "@/components/AdminOrderActions";
import AutoRefresh from "@/components/AutoRefresh";
import DispatchTicker from "@/components/DispatchTicker";

export default async function AdminOrdersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const orders = listAllOrders(100);
  const couriers = listCouriers()
    .filter((c) => c!.approvalStatus === "approved")
    .map((c) => ({ id: c!.id, email: c!.email, tier: c!.tier, isOnline: c!.isOnline }));

  const stuck = orders.filter((o) => o!.status === "PENDING").length;

  return (
    <div className="space-y-4">
      <AutoRefresh intervalMs={10000} />
      <DispatchTicker intervalMs={10000} />

      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500">
          {orders.length} total · {stuck} waiting for a courier
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Merchant</th>
              <th className="p-3">Status</th>
              <th className="p-3">Courier</th>
              <th className="p-3">Promised</th>
              <th className="p-3">Dispatch</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o!.id} className="border-t border-gray-100 align-top">
                <td className="p-3">
                  <Link href={`/track/${o!.id}`} className="font-mono text-xs text-brand hover:underline">
                    {o!.id.slice(0, 8)}…
                  </Link>
                  <div className="text-xs text-gray-400">{o!.customerName}</div>
                </td>
                <td className="p-3">{o!.merchantBusinessName}</td>
                <td className="p-3">
                  <StatusPill status={o!.status} />
                  {o!.failureReason && (
                    <div className="mt-1 text-xs text-red-500">{o!.failureReason}</div>
                  )}
                </td>
                <td className="p-3 text-xs">{o!.courierEmail ?? "—"}</td>
                <td className="p-3 text-xs">
                  {o!.windowEnd
                    ? new Date(o!.windowEnd).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "ASAP"}
                </td>
                <td className="p-3 text-xs text-gray-500">{o!.dispatchMode}</td>
                <td className="p-3">
                  <AdminOrderActions orderId={o!.id} status={o!.status} couriers={couriers} />
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td className="p-3 text-gray-400" colSpan={7}>
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "DELIVERED"
      ? "bg-green-100 text-green-700"
      : status === "PENDING"
      ? "bg-yellow-100 text-yellow-700"
      : status === "FAILED" || status === "RETURNING" || status === "RETURNED"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${tone}`}>
      {ORDER_STATUS_LABEL[status as OrderStatus] ?? status}
    </span>
  );
}
