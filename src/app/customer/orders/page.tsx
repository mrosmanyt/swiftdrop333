import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { findUserById, listOrdersForCustomer } from "@/lib/repo";
import { Card, EmptyState, PageHeader, StatusBadge, TableWrap, orderRef } from "@/components/portal/ui";

const ACTIVE = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];

export default async function CustomerOrdersPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "CUSTOMER") redirect("/login");

  const user = findUserById(session.id);
  const orders = listOrdersForCustomer({ email: user?.email ?? session.email, phone: user?.phone }, 300);

  return (
    <div className="space-y-6">
      <PageHeader title="Order History" subtitle="Every delivery sent to your email or phone number." />

      <Card bodyClassName="">
        {orders.length ? (
          <TableWrap>
            <table className="w-full text-left text-sm">
              <thead className="text-[12.5px] uppercase tracking-wide text-fg-subtle">
                <tr className="border-b border-line">
                  <th className="px-4 py-2.5 font-medium">Delivery</th>
                  <th className="px-4 py-2.5 font-medium">From</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Price</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b border-line last:border-0 hover:bg-fg/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg">{orderRef(o.id)}</p>
                      <p className="mt-0.5 max-w-[26ch] truncate text-[12.5px] text-fg-subtle sm:max-w-[40ch]">
                        {o.dropoffAddress}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-fg-muted">{o.merchantBusinessName ?? "SwiftDrop"}</td>
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
