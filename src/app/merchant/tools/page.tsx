import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getMerchantProfileByUserId, listActiveZones, listApiKeys, listWebhookDeliveries } from "@/lib/repo";
import BulkUpload from "@/components/BulkUpload";
import ApiKeyManager from "@/components/ApiKeyManager";
import RecurringManager from "@/components/RecurringManager";

export default async function MerchantToolsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "MERCHANT") redirect("/login");

  const merchant = getMerchantProfileByUserId(user.id);
  if (!merchant) return <p>No merchant profile found.</p>;

  const zones = listActiveZones();
  const keys = listApiKeys(merchant.id);
  const webhooks = listWebhookDeliveries(merchant.id, 10);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-sm text-fg-muted">
          Bulk upload, standing schedules, and API access for your own systems.
        </p>
      </div>

      <BulkUpload zones={zones as any} defaultPickup={merchant.businessAddress ?? ""} />

      <RecurringManager zones={zones as any} defaultPickup={merchant.businessAddress ?? ""} />

      <ApiKeyManager initialKeys={keys} />

      {webhooks.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">Recent webhook deliveries</h2>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="text-fg-subtle">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">URL</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((w) => (
                  <tr key={w.id} className="border-t border-line">
                    <td className="p-3 text-xs text-fg-subtle">
                      {new Date(w.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-xs">{w.event}</td>
                    <td className="p-3 max-w-xs truncate text-xs text-fg-muted">{w.url}</td>
                    <td className="p-3 text-xs">
                      <span className={w.status === "delivered" ? "text-ok" : "text-danger"}>
                        {w.status} {w.response_code ? `(${w.response_code})` : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
