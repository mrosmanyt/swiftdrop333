import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getCourierProfileByUserId, demandHeatmap, demandByHour } from "@/lib/repo";
import { courierBlockReason } from "@/lib/guards";
import BatchRoutes from "@/components/BatchRoutes";

export default async function DriverDemandPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "COURIER") redirect("/login");

  const courier = getCourierProfileByUserId(user.id);
  const blocked = courierBlockReason(courier);
  if (blocked) {
    return (
      <div className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm text-warn">
        {blocked}
      </div>
    );
  }

  const zones = demandHeatmap(24);
  const byHour = demandByHour(7);
  const peak = Math.max(1, ...byHour.map((h) => h.orderCount));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Where the work is</h1>
        <p className="text-sm text-fg-muted">Last 24 hours of demand, by zone.</p>
      </div>

      <div className="space-y-2">
        {zones.map((z) => {
          const busiest = Math.max(1, ...zones.map((x) => x.orderCount));
          const pct = Math.round((z.orderCount / busiest) * 100);
          return (
            <div key={z.zoneId} className="rounded-xl border border-line bg-surface p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {z.city} — {z.zoneName}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {z.waiting} waiting now · {z.orderCount} in 24h
                  </p>
                </div>
                {z.surgeMultiplier > 1 && (
                  <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
                    {z.surgeMultiplier}× surge
                  </span>
                )}
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${z.waiting > 0 ? "bg-accent-solid" : "bg-fg/15"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {!zones.length && <p className="text-sm text-fg-subtle">No demand data yet.</p>}
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Busiest hours (last 7 days)</h2>
        <div className="flex items-end gap-1 rounded-xl border border-line bg-surface p-4">
          {Array.from({ length: 24 }, (_, hour) => {
            const found = byHour.find((h) => h.hour === hour);
            const count = found?.orderCount ?? 0;
            const height = Math.max(3, Math.round((count / peak) * 60));
            return (
              <div key={hour} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${count > 0 ? "bg-accent-solid" : "bg-surface-2"}`}
                  style={{ height }}
                  title={`${hour}:00 — ${count} orders`}
                />
                {hour % 6 === 0 && <span className="text-[9px] text-fg-subtle">{hour}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <BatchRoutes />
    </div>
  );
}
