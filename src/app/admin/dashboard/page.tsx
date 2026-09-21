import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import {
  countMerchants,
  countCouriers,
  countOnlineCouriers,
  orderStatusCounts,
  opsSummary,
} from "@/lib/repo";
import AutoRefresh from "@/components/AutoRefresh";
import { Card, PageHeader, Stat, StatusBadge } from "@/components/portal/ui";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default async function AdminOverviewPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const merchantCount = countMerchants();
  const courierCount = countCouriers();
  const onlineCouriers = countOnlineCouriers();
  const orderCounts = orderStatusCounts();
  const ops = opsSummary();

  const totalOrders = orderCounts.reduce((sum, r) => sum + r.count, 0);
  const delivered = orderCounts.find((r) => r.status === "DELIVERED")?.count ?? 0;
  const completionRate = totalOrders ? ((delivered / totalOrders) * 100).toFixed(1) : "—";
  const maxStatus = Math.max(1, ...orderCounts.map((r) => r.count));

  // Everything here is someone waiting on a decision, so an empty queue is
  // the good outcome and a non-empty one should be visibly warm.
  const queues = [
    { label: "Merchants to verify", value: ops.pendingMerchants, href: "/admin/applications" },
    { label: "Couriers to approve", value: ops.pendingCouriers, href: "/admin/applications" },
    { label: "Unassigned deliveries", value: ops.unassignedOrders, href: "/admin/orders" },
    { label: "Open disputes", value: ops.openDisputes, href: "/admin/support" },
    { label: "Open tickets", value: ops.openTickets, href: "/admin/support" },
    { label: "Payouts to review", value: ops.pendingPayouts, href: "/admin/operations" },
  ];
  const needsAttention = queues.reduce((n, q) => n + q.value, 0);

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={8000} />

      <PageHeader
        title="Ops overview"
        subtitle={
          needsAttention
            ? `${needsAttention} item${needsAttention === 1 ? "" : "s"} waiting on someone.`
            : "Nothing waiting on a decision right now."
        }
        action={
          <Link
            href="/admin/live-map"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] font-medium text-fg transition-colors hover:border-accent/40"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-live opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
            </span>
            Live map
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {queues.map((q) => (
          <Stat
            key={q.label}
            label={q.label}
            value={q.value}
            href={q.href}
            tone={q.value > 0 ? "warn" : "default"}
          />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <Card title="Today">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Delivered" value={ops.deliveredToday} tone="ok" />
            <Stat label="In flight" value={ops.inFlightOrders} tone="accent" />
            <Stat label="Failed" value={ops.failedToday} tone={ops.failedToday ? "danger" : "default"} />
            <Stat label="Gross" value={money(ops.grossTodayCents)} hint={`${money(ops.platformTodayCents)} to SwiftDrop`} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Merchants" value={merchantCount} href="/admin/merchants" />
            <Stat label="Couriers" value={courierCount} href="/admin/couriers" />
            <Stat label="Online now" value={onlineCouriers} tone={onlineCouriers ? "ok" : "warn"} />
            <Stat label="Completion" value={`${completionRate}%`} hint={`${totalOrders} orders all-time`} />
          </div>
        </Card>

        <Card title="Orders by status" bodyClassName="p-4">
          {orderCounts.length ? (
            <ul className="space-y-2.5">
              {orderCounts
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((r) => (
                  <li key={r.status}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <StatusBadge status={r.status} />
                      <span className="font-medium tabular-nums text-fg">{r.count}</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-fg/10">
                      <div
                        className="h-full rounded-full bg-accent-solid"
                        style={{ width: `${Math.round((r.count / maxStatus) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-fg-subtle">No orders yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
