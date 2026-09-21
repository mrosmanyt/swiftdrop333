import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listDeletedMerchants, listDeletedCouriers, listDeletedOrders } from "@/lib/repo";
import AdminRestoreButton from "@/components/AdminRestoreButton";
import { ORDER_STATUS_LABEL, OrderStatus } from "@/lib/types";

/**
 * Everything an admin deletes from /admin/merchants, /admin/couriers, or
 * /admin/orders lands here instead of being erased — a soft delete sets
 * deleted_at/deleted_by on the row (see softDelete* in src/lib/repo.ts) and
 * every normal list query filters it out. Nothing here is gone for good;
 * Restore clears deleted_at and puts the record straight back.
 */
export default async function DeletedRecordsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const merchants = listDeletedMerchants();
  const couriers = listDeletedCouriers();
  const orders = listDeletedOrders(200);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Deleted records</h1>
        <p className="text-sm text-fg-muted">
          Deleted merchants, couriers, and orders live here — nothing is erased. Restore brings a record straight
          back into its normal list.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Merchants ({merchants.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="text-fg-subtle">
              <tr>
                <th className="p-3">Business</th>
                <th className="p-3">Email</th>
                <th className="p-3">Deleted at</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => (
                <tr key={m!.id} className="border-t border-line">
                  <td className="p-3">{m!.businessName}</td>
                  <td className="p-3">{m!.email}</td>
                  <td className="p-3 text-xs text-fg-subtle">
                    {m!.deletedAt ? new Date(m!.deletedAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">
                    <AdminRestoreButton resource="merchants" id={m!.id} />
                  </td>
                </tr>
              ))}
              {!merchants.length && (
                <tr>
                  <td className="p-3 text-fg-subtle" colSpan={4}>
                    No deleted merchants.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Couriers ({couriers.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="text-fg-subtle">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Deleted at</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {couriers.map((c) => (
                <tr key={c!.id} className="border-t border-line">
                  <td className="p-3">{c!.email}</td>
                  <td className="p-3">{c!.vehicleType}</td>
                  <td className="p-3 text-xs text-fg-subtle">
                    {c!.deletedAt ? new Date(c!.deletedAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">
                    <AdminRestoreButton resource="couriers" id={c!.id} />
                  </td>
                </tr>
              ))}
              {!couriers.length && (
                <tr>
                  <td className="p-3 text-fg-subtle" colSpan={4}>
                    No deleted couriers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Orders ({orders.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="text-fg-subtle">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Merchant</th>
                <th className="p-3">Status</th>
                <th className="p-3">Deleted at</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o!.id} className="border-t border-line">
                  <td className="p-3 font-mono text-xs">{o!.id.slice(0, 8)}…</td>
                  <td className="p-3">{o!.merchantBusinessName ?? "—"}</td>
                  <td className="p-3">{ORDER_STATUS_LABEL[o!.status as OrderStatus] ?? o!.status}</td>
                  <td className="p-3 text-xs text-fg-subtle">
                    {o!.deletedAt ? new Date(o!.deletedAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">
                    <AdminRestoreButton resource="orders" id={o!.id} />
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td className="p-3 text-fg-subtle" colSpan={5}>
                    No deleted orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
