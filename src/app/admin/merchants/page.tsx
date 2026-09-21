import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listMerchants, merchantPickupStats } from "@/lib/repo";
import DownloadCsvButton from "@/components/DownloadCsvButton";
import AdminDeleteButton from "@/components/AdminDeleteButton";

export default async function AdminMerchantsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const merchants = listMerchants();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Merchants</h1>
        <DownloadCsvButton href="/api/admin/merchants/export" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="text-fg-subtle">
            <tr>
              <th className="p-3">Business</th>
              <th className="p-3">Email</th>
              <th className="p-3">KYB status</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Courier rating</th>
              <th className="p-3">Avg pickup wait</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m!.id} className="border-t border-line">
                <td className="p-3">{m!.businessName}</td>
                <td className="p-3">{m!.email}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      m!.kybStatus === "verified" ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"
                    }`}
                  >
                    {m!.kybStatus}
                  </span>
                </td>
                <td className="p-3">{m!.orderCount}</td>
                <td className="p-3">{m!.rating ? `${m!.rating.toFixed(1)}★` : "—"}</td>
                <td className="p-3">
                  {(() => {
                    const s = merchantPickupStats(m!.id);
                    if (!s.samples || s.avgWaitMinutes == null) return <span className="text-fg-subtle">—</span>;
                    const slow = s.avgWaitMinutes > 10;
                    return (
                      <span className={slow ? "font-medium text-danger" : "text-fg-muted"}>
                        {s.avgWaitMinutes} min
                        <span className="ml-1 text-xs text-fg-subtle">({s.samples})</span>
                      </span>
                    );
                  })()}
                </td>
                <td className="p-3">
                  <AdminDeleteButton resource="merchants" id={m!.id} label={m!.businessName} />
                </td>
              </tr>
            ))}
            {!merchants.length && (
              <tr>
                <td className="p-3 text-fg-subtle" colSpan={7}>
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
