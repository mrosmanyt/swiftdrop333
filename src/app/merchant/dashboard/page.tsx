import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getMerchantProfileByUserId, listOrdersForMerchant } from "@/lib/repo";
import { merchantBlockReason } from "@/lib/guards";
import {
  Card,
  EmptyState,
  PageHeader,
  Stat,
  StatusBadge,
  TableWrap,
  orderRef,
} from "@/components/portal/ui";

const ACTIVE = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];

export default async function MerchantDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "MERCHANT") redirect("/login");

  const merchant = getMerchantProfileByUserId(user.id);
  const orders = merchant ? listOrdersForMerchant(merchant.id, 200) : [];
  const blockReason = merchantBlockReason(merchant);

  const recent = orders.slice(0, 8);
  const activeCount = orders.filter((o) => ACTIVE.includes(o!.status)).length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = orders.filter((o) => new Date(o!.createdAt) >= startOfToday);
  const spentTodayCents = today.reduce((sum, o) => sum + (o!.priceCents ?? 0), 0);
  const deliveredToday = today.filter((o) => o!.status === "DELIVERED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={merchant?.businessName}
        action={
          blockReason ? (
            <span
              title={blockReason}
              className="cursor-not-allowed rounded-lg bg-surface-2 px-3.5 py-2 text-[13.5px] font-medium text-fg-subtle"
            >
              + New delivery
            </span>
          ) : (
            <Link
              href="/merchant/orders/new"
              className="rounded-lg bg-accent-solid px-3.5 py-2 text-[13.5px] font-medium text-white transition-opacity hover:opacity-90"
            >
              + New delivery
            </Link>
          )
        }
      />

      {blockReason && (
        <div className="rounded-2xl border border-warn/30 bg-warn-soft p-4 text-sm text-warn">
          <p className="font-medium">
            {merchant?.kybStatus === "rejected" ? "Verification rejected" : "Verification in progress"}
          </p>
          <p className="mt-1">{blockReason}</p>
          {merchant?.kybNotes && <p className="mt-1 italic">Note from our team: {merchant.kybNotes}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Out for delivery"
          value={activeCount}
          tone={activeCount ? "accent" : "default"}
          href="/merchant/orders"
        />
        <Stat label="Booked today" value={today.length} hint={`${deliveredToday} already delivered`} />
        <Stat label="Spent today" value={`$${(spentTodayCents / 100).toFixed(2)}`} />
        <Stat
          label="Verification"
          value={merchant?.kybStatus ?? "—"}
          tone={merchant?.kybStatus === "verified" ? "ok" : "warn"}
        />
      </div>

      <Card
        title="Recent deliveries"
        action={
          <Link href="/merchant/orders" className="text-[13px] text-accent hover:underline">
            View all
          </Link>
        }
        bodyClassName=""
      >
        {recent.length ? (
          <TableWrap>
            <table className="w-full text-left text-sm">
              <thead className="text-[12.5px] uppercase tracking-wide text-fg-subtle">
                <tr className="border-b border-line">
                  <th className="px-4 py-2.5 font-medium">Delivery</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Service</th>
                  <th className="px-4 py-2.5 text-right font-medium">Price</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o!.id} className="border-b border-line last:border-0 hover:bg-fg/[0.02]">
                    <td className="px-4 py-3">
                      {/* The customer and where it's going is what a merchant
                          recognises; the reference is for phone calls. */}
                      <p className="font-medium text-fg">{o!.customerName}</p>
                      <p className="mt-0.5 max-w-[26ch] truncate text-[12.5px] text-fg-subtle sm:max-w-[40ch]">
                        {orderRef(o!.id)} · {o!.dropoffAddress}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o!.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                      {o!.serviceType.toLowerCase().replace(/_/g, " ")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                      ${(o!.priceCents / 100).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/merchant/orders/${o!.id}`} className="text-accent hover:underline">
                        {ACTIVE.includes(o!.status) ? "Track" : "Details"} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState
            title="No deliveries yet"
            hint="Book your first one and it goes out to nearby couriers within seconds."
            action={
              !blockReason && (
                <Link
                  href="/merchant/orders/new"
                  className="inline-block rounded-lg bg-accent-solid px-3.5 py-2 text-[13.5px] font-medium text-white hover:opacity-90"
                >
                  Book a delivery
                </Link>
              )
            }
          />
        )}
      </Card>
    </div>
  );
}
