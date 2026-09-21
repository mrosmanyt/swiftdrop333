import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getMerchantProfileByUserId, merchantAnalytics } from "@/lib/repo";
import { Card, EmptyState, PageHeader, Stat, TableWrap } from "@/components/portal/ui";

const SERVICE_LABEL: Record<string, string> = {
  NEXT_DAY: "Next Day",
  SAME_DAY: "Same Day",
  DIRECT: "Direct",
  BATCH: "Batch",
};

export default async function MerchantAnalyticsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "MERCHANT") redirect("/login");

  const merchant = getMerchantProfileByUserId(user.id);
  if (!merchant) return <p>No merchant profile found.</p>;

  const { dailySeries, topCustomers, successRate, delivered, terminal, serviceBreakdown } = merchantAnalytics(
    merchant.id,
    14
  );

  const totalOrders14d = dailySeries.reduce((sum: number, d: any) => sum + d.orders, 0);
  const totalRevenue14d = dailySeries.reduce((sum: number, d: any) => sum + d.revenueCents, 0);
  const peakOrders = Math.max(1, ...dailySeries.map((d: any) => d.orders));
  const totalServiceRevenue = Math.max(1, serviceBreakdown.reduce((sum: number, s: any) => sum + s.revenueCents, 0));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Last 14 days" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orders (14d)" value={totalOrders14d} />
        <Stat label="Revenue (14d)" value={`$${(totalRevenue14d / 100).toFixed(2)}`} tone="accent" />
        <Stat
          label="Success rate"
          value={successRate != null ? `${successRate}%` : "—"}
          hint={terminal ? `${delivered} of ${terminal} completed deliveries` : "No completed deliveries yet"}
          tone={successRate == null ? "default" : successRate >= 90 ? "ok" : successRate >= 70 ? "warn" : "danger"}
        />
        <Stat
          label="Avg order value"
          value={totalOrders14d ? `$${(totalRevenue14d / totalOrders14d / 100).toFixed(2)}` : "—"}
        />
      </div>

      <Card title="Orders per day">
        {dailySeries.length ? (
          <div className="flex h-40 items-end gap-1.5">
            {dailySeries.map((d: any) => {
              const height = Math.max(4, Math.round((d.orders / peakOrders) * 130));
              const label = new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t bg-accent-solid transition-all"
                    style={{ height }}
                    title={`${label}: ${d.orders} orders, $${(d.revenueCents / 100).toFixed(2)}`}
                  />
                  <span className="text-[10px] text-fg-subtle">{label.split(" ")[1]}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No orders in this window yet" />
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Cost breakdown by service" bodyClassName="p-4">
          {serviceBreakdown.length ? (
            <div className="space-y-3">
              {serviceBreakdown.map((s: any) => {
                const pct = Math.round((s.revenueCents / totalServiceRevenue) * 100);
                return (
                  <div key={s.serviceType}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium text-fg">{SERVICE_LABEL[s.serviceType] ?? s.serviceType}</span>
                      <span className="text-fg-muted">
                        {s.orderCount} orders · ${(s.revenueCents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-accent-solid" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No delivery data yet" />
          )}
        </Card>

        <Card title="Top customers" bodyClassName="">
          {topCustomers.length ? (
            <TableWrap>
              <table className="w-full text-left text-sm">
                <thead className="text-[12.5px] uppercase tracking-wide text-fg-subtle">
                  <tr className="border-b border-line">
                    <th className="px-4 py-2.5 font-medium">Customer</th>
                    <th className="px-4 py-2.5 text-right font-medium">Orders</th>
                    <th className="px-4 py-2.5 text-right font-medium">Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c: any) => (
                    <tr key={c.customerName} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 text-fg">{c.customerName}</td>
                      <td className="px-4 py-2.5 text-right text-fg-muted">{c.orderCount}</td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                        ${(c.spentCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <EmptyState title="No customers yet" />
          )}
        </Card>
      </div>
    </div>
  );
}
