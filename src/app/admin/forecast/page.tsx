import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supplyForecast, countOnlineCouriers, countCouriers } from "@/lib/repo";

export default async function AdminForecastPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const forecast = supplyForecast();
  const onlineNow = countOnlineCouriers();
  const total = countCouriers();

  // Group by zone for a readable per-zone hourly strip.
  const byZone = new Map<string, typeof forecast>();
  for (const f of forecast) {
    const list = byZone.get(f.zoneId) ?? [];
    list.push(f);
    byZone.set(f.zoneId, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Supply forecast</h1>
        <p className="text-sm text-fg-muted">
          Couriers likely needed by zone and hour, from the last 3 weeks of demand.{" "}
          {onlineNow} of {total} couriers online right now.
        </p>
      </div>

      {[...byZone.entries()].map(([zoneId, rows]) => {
        const peak = Math.max(...rows.map((r) => r.couriersNeeded));
        const zone = rows[0];
        return (
          <div key={zoneId} className="rounded-xl border border-line bg-surface p-4">
            <p className="font-medium">
              {zone.city} — {zone.zoneName}
            </p>
            <div className="mt-3 flex items-end gap-1">
              {Array.from({ length: 24 }, (_, hour) => {
                const row = rows.find((r) => r.hour === hour);
                const needed = row?.couriersNeeded ?? 0;
                const height = needed ? Math.max(6, (needed / peak) * 56) : 3;
                const short = needed > onlineNow;
                return (
                  <div key={hour} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t ${
                        needed === 0 ? "bg-surface-2" : short ? "bg-danger-solid" : "bg-accent-solid"
                      }`}
                      style={{ height }}
                      title={`${hour}:00 — need ~${needed} courier(s), ${row?.avgOrdersPerDay ?? 0} orders/day`}
                    />
                    {hour % 6 === 0 && <span className="text-[9px] text-fg-subtle">{hour}</span>}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-fg-subtle">
              Red bars are hours where forecast demand exceeds the couriers you currently have
              online — that&apos;s where a challenge or surge pays for itself.
            </p>
          </div>
        );
      })}

      {!byZone.size && (
        <p className="text-sm text-fg-subtle">
          Not enough order history yet to forecast. Come back once deliveries are flowing.
        </p>
      )}
    </div>
  );
}
