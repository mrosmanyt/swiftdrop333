import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { financialSummary } from "@/lib/repo";
import { Card, EmptyState, PageHeader, Stat } from "@/components/portal/ui";
import DownloadCsvButton from "@/components/DownloadCsvButton";

export default async function AdminFinancePage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const summary = financialSummary(30);
  const peak = Math.max(1, ...summary.dailySeries.map((d: any) => d.grossCents));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        subtitle="Last 30 days — platform revenue, what's owed to couriers, and refunds issued."
        action={<DownloadCsvButton href="/api/admin/finance/export" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Gross revenue" value={`$${(summary.grossRevenueCents / 100).toFixed(2)}`} hint={`${summary.deliveredOrders} delivered orders`} />
        <Stat label="Platform revenue (net)" value={`$${(summary.netRevenueCents / 100).toFixed(2)}`} tone="accent" hint="Platform fees minus refunds" />
        <Stat label="Owed to couriers" value={`$${(summary.courierFeeCents / 100).toFixed(2)}`} hint={`$${(summary.paidOutCents / 100).toFixed(2)} already paid out`} />
        <Stat
          label="Refunded"
          value={`$${(summary.refundedCents / 100).toFixed(2)}`}
          hint={`${summary.refundCount} refund${summary.refundCount === 1 ? "" : "s"}`}
          tone={summary.refundedCents ? "warn" : "default"}
        />
      </div>

      {summary.pendingPayoutCents > 0 && (
        <div className="rounded-xl border border-warn/30 bg-warn-soft p-3.5 text-[13px] text-fg">
          <span className="font-medium">${(summary.pendingPayoutCents / 100).toFixed(2)}</span> in courier payout
          requests are still awaiting approval or processing.
        </div>
      )}

      <Card title="Gross revenue per day">
        {summary.dailySeries.length ? (
          <div className="flex h-40 items-end gap-1.5">
            {summary.dailySeries.map((d: any) => {
              const height = Math.max(4, Math.round((d.grossCents / peak) * 130));
              const label = new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t bg-accent-solid transition-all"
                    style={{ height }}
                    title={`${label}: ${d.orders} orders · $${(d.grossCents / 100).toFixed(2)} gross · $${(d.platformCents / 100).toFixed(2)} platform`}
                  />
                  <span className="text-[10px] text-fg-subtle">{label.split(" ")[1]}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No delivered orders in this window yet" />
        )}
      </Card>
    </div>
  );
}
