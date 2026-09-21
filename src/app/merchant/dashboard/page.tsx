import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getMerchantProfileByUserId, listOrdersForMerchant } from "@/lib/repo";
import { merchantBlockReason } from "@/lib/guards";

export default async function MerchantDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "MERCHANT") redirect("/login");

  const merchant = getMerchantProfileByUserId(user.id);
  const orders = merchant ? listOrdersForMerchant(merchant.id, 10) : [];
  const activeCount = orders.filter((o) => ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(o!.status)).length;
  const blockReason = merchantBlockReason(merchant);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Merchant Dashboard</h1>
        <p className="text-gray-500">{merchant?.businessName}</p>
      </div>

      {blockReason && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <p className="font-medium">
            {merchant?.kybStatus === "rejected" ? "Verification rejected" : "Verification in progress"}
          </p>
          <p className="mt-1">{blockReason}</p>
          {merchant?.kybNotes && <p className="mt-1 italic">Admin note: {merchant.kybNotes}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active deliveries" value={activeCount} />
        <StatCard label="KYB status" value={merchant?.kybStatus ?? "—"} />
        <StatCard label="Shopify connected" value={merchant?.shopifyDomain ? "Yes" : "Not yet"} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="font-semibold">Recent orders</h2>
          {blockReason ? (
            <span className="cursor-not-allowed rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-400">
              + New delivery
            </span>
          ) : (
            <Link
              href="/merchant/orders/new"
              className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
            >
              + New delivery
            </Link>
          )}
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Status</th>
              <th className="p-3">Service</th>
              <th className="p-3">Price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o!.id} className="border-t border-gray-100">
                <td className="p-3 font-mono text-xs">{o!.id.slice(0, 10)}…</td>
                <td className="p-3">{o!.status}</td>
                <td className="p-3">{o!.serviceType}</td>
                <td className="p-3">${(o!.priceCents / 100).toFixed(2)}</td>
                <td className="p-3">
                  <Link href={`/merchant/orders/${o!.id}`} className="text-brand hover:underline">
                    Track →
                  </Link>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td className="p-3 text-gray-400" colSpan={5}>
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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
