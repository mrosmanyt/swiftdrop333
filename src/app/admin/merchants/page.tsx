import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listMerchants } from "@/lib/repo";

export default async function AdminMerchantsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const merchants = listMerchants();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Merchants</h1>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="p-3">Business</th>
              <th className="p-3">Email</th>
              <th className="p-3">KYB status</th>
              <th className="p-3">Orders</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m!.id} className="border-t border-gray-100">
                <td className="p-3">{m!.businessName}</td>
                <td className="p-3">{m!.email}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      m!.kybStatus === "verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {m!.kybStatus}
                  </span>
                </td>
                <td className="p-3">{m!.orderCount}</td>
              </tr>
            ))}
            {!merchants.length && (
              <tr>
                <td className="p-3 text-gray-400" colSpan={4}>
                  No merchants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
