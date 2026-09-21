import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listCouriers } from "@/lib/repo";
import AutoRefresh from "@/components/AutoRefresh";

export default async function AdminCouriersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const couriers = listCouriers();

  return (
    <div className="space-y-4">
      <AutoRefresh intervalMs={10000} />
      <h1 className="text-2xl font-bold">Couriers</h1>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="text-fg-subtle">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Background check</th>
              <th className="p-3">Deliveries</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {couriers.map((c) => (
              <tr key={c!.id} className="border-t border-line">
                <td className="p-3">{c!.email}</td>
                <td className="p-3">{c!.vehicleType}</td>
                <td className="p-3">{c!.tier}</td>
                <td className="p-3">{c!.rating.toFixed(1)}</td>
                <td className="p-3">{c!.backgroundCheckStatus}</td>
                <td className="p-3">{c!.orderCount}</td>
                <td className="p-3">
                  {c!.isOnline ? (
                    <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs text-ok">● Online</span>
                  ) : (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-fg-muted">○ Offline</span>
                  )}
                </td>
              </tr>
            ))}
            {!couriers.length && (
              <tr>
                <td className="p-3 text-fg-subtle" colSpan={7}>
                  No couriers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
