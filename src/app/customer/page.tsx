import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { findUserById, getLoyaltyAccount, listOrdersForCustomer } from "@/lib/repo";
import { Card, EmptyState, PageHeader, Stat, StatusBadge, TableWrap, orderRef } from "@/components/portal/ui";

const ACTIVE = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];

export default async function CustomerDashboard() {
  const session = await getSessionUser();
  if (!session || session.role !== "CUSTOMER") redirect("/login");

  const user = findUserById(session.id);
  const orders = listOrdersForCustomer({ email: user?.email ?? session.email, phone: user?.phone }, 200);
  const loyalty = getLoyaltyAccount(session.id);

  const activeCount = orders.filter((o: any) => ACTIVE.includes(o.status)).length;
  const deliveredCount = orders.filter((o: any) => o.status === "DELIVERED").length;
  const recent = orders.slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={user?.fullName ?? user?.email} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Out for delivery" value={activeCount} tone={activeCount ? "accent" : "default"} href="/customer/orders" />
        <Stat label="Delivered" value={deliveredCount} href="/customer/orders" />
        <Stat label="Loyalty points" value={loyalty?.points ?? 0} tone="accent" href="/customer/loyalty" />
        <Stat label="Referral code" value={loyalty?.referralCode ?? "—"} href="/customer/loyalty" />
      </div>

      <Card
        title="Recent deliveries"
        action={
          <Link href="/customer/orders" className="text-[13px] text-accent hover:underline">
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
                  <th className="px-4 py-2.5 text-right font-medium">Price</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {recent.map((o: any) => (
                  <tr key={o.id} className="border-b border-line last:border-0 hover:bg-fg/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg">{o.merchantBusinessName ?? "SwiftDrop"}</p>
                      <p className="mt-0.5 max-w-[26ch] truncate text-[12.5px] text-fg-subtle sm:max-w-[40ch]">
                        {orderRef(o.id)} · {o.dropoffAddress}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                      ${(o.priceCents / 100).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/track/${o.id}`} className="text-accent hover:underline">
                        {ACTIVE.includes(o.status) ? "Track" : "Details"} →
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
            hint="Once a business sends you a delivery using this email or phone number, it'll show up here automatically."
          />
        )}
      </Card>
    </div>
  );
}
