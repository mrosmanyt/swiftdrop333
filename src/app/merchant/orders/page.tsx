import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getMerchantProfileByUserId, listOrdersForMerchant } from "@/lib/repo";
import { ORDER_STATUS_LABEL } from "@/lib/types";

export default async function MerchantOrdersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "MERCHANT") redirect("/login");

  const merchant = getMerchantProfileByUserId(user.id);
  const orders = merchant ? listOrdersForMerchant(merchant.id, 100) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All orders</h1>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Status</th>
              <th className="p-3">Pickup</th>
              <th className="p-3">Dropoff</th>
              <th className="p-3">Price</th>
              <th className="p-3">Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o!.id} className="border-t border-gray-100">
                <td className="p-3 font-mono text-xs">{o!.id.slice(0, 10)}…</td>
                <td className="p-3">{ORDER_STATUS_LABEL[o!.status]}</td>
                <td className="p-3">{o!.pickupAddress}</td>
                <td className="p-3">{o!.dropoffAddress}</td>
                <td className="p-3">${(o!.priceCents / 100).toFixed(2)}</td>
                <td className="p-3">{new Date(o!.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <Link href={`/merchant/orders/${o!.id}`} className="text-brand hover:underline">
                    Track →
                  </Link>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td className="p-3 text-gray-400" colSpan={7}>
                  No orders yet — create one from "New delivery".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
