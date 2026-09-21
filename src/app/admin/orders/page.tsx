import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listAllOrders, listCouriers } from "@/lib/repo";
import { ORDER_STATUS_LABEL, OrderStatus } from "@/lib/types";
import AdminOrderActions from "@/components/AdminOrderActions";
import AutoRefresh from "@/components/AutoRefresh";
import DispatchTicker from "@/components/DispatchTicker";
import DownloadCsvButton from "@/components/DownloadCsvButton";
import AdminDeleteButton from "@/components/AdminDeleteButton";

const IN_FLIGHT = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-fg-muted">
            {orders.length} total · {stuck} waiting for a courier
          </p>
        </div>
        <DownloadCsvButton href="/api/admin/orders/export" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="text-fg-subtle">
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
              <tr key={o!.id} className="border-t border-line align-top">
                <td className="p-3">
                  <Link href={`/track/${o!.id}`} className="font-mono text-xs text-accent hover:underline">
                    {o!.id.slice(0, 8)}…
                  </Link>
                  <div className="text-xs text-fg-subtle">{o!.customerName}</div>
                </td>
                <td className="p-3">{o!.merchantBusinessName}</td>
                <td className="p-3">
                  <StatusPill status={o!.status} />
                  {o!.failureReason && (
                    <div className="mt-1 text-xs text-danger">{o!.failureReason}</div>
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
                  {IN_FLIGHT.includes(o!.status) && o!.windowEnd && new Date(o!.windowEnd) < new Date() && (
                    <div className="mt-1 inline-block rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-medium text-danger">
                      LATE
                    </div>
                  )}
                </td>
                <td className="p-3 text-xs text-fg-muted">{o!.dispatchMode}</td>
                <td className="p-3">
                  <div className="flex flex-col items-start gap-2">
                    <AdminOrderActions
                      orderId={o!.id}
                      status={o!.status}
                      couriers={couriers}
                      refundStatus={o!.refundStatus}
                    />
                    <AdminDeleteButton resource="orders" id={o!.id} label={`order ${o!.id.slice(0, 8)}`} />
                  </div>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td className="p-3 text-fg-subtle" colSpan={7}>
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
      ? "bg-ok-soft text-ok"
      : status === "PENDING"
      ? "bg-warn-soft text-warn"
      : status === "FAILED" || status === "RETURNING" || status === "RETURNED" || status === "CANCELLED"
      ? "bg-danger-soft text-danger"
      : "bg-info-soft text-info";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${tone}`}>
      {ORDER_STATUS_LABEL[status as OrderStatus] ?? status}
    </span>
  );
}
