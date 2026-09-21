import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getMerchantProfileByUserId, listOrdersForMerchant } from "@/lib/repo";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  TableWrap,
  orderRef,
} from "@/components/portal/ui";

const FILTERS = [
  { key: "all", label: "All", match: () => true },
  { key: "active", label: "In progress", match: (s: string) => ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(s) },
  { key: "delivered", label: "Delivered", match: (s: string) => s === "DELIVERED" },
  { key: "problem", label: "Needs attention", match: (s: string) => ["FAILED", "RETURNING", "RETURNED", "CANCELLED"].includes(s) },
];

export default async function MerchantOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "MERCHANT") redirect("/login");

  const merchant = getMerchantProfileByUserId(user.id);
  const all = merchant ? listOrdersForMerchant(merchant.id, 200) : [];

  const active = FILTERS.find((f) => f.key === searchParams.status) ?? FILTERS[0];
  const orders = all.filter((o) => active.match(o!.status));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        subtitle={`${all.length} deliver${all.length === 1 ? "y" : "ies"} booked`}
        action={
          <Link
            href="/merchant/orders/new"
            className="rounded-lg bg-accent-solid px-3.5 py-2 text-[13.5px] font-medium text-white hover:opacity-90"
          >
            + New delivery
          </Link>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const count = all.filter((o) => f.match(o!.status)).length;
          const on = f.key === active.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/merchant/orders" : `/merchant/orders?status=${f.key}`}
              className={`rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                on
                  ? "bg-accent/10 font-medium text-accent"
                  : "border border-line text-fg-muted hover:bg-fg/5"
              }`}
            >
              {f.label}
              <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
            </Link>
          );
        })}
      </div>

      <Card bodyClassName="">
        {orders.length ? (
          <TableWrap>
            <table className="w-full text-left text-sm">
              <thead className="text-[12.5px] uppercase tracking-wide text-fg-subtle">
                <tr className="border-b border-line">
                  <th className="px-4 py-2.5 font-medium">Delivery</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Route</th>
                  <th className="px-4 py-2.5 text-right font-medium">Price</th>
                  <th className="px-4 py-2.5 font-medium">Booked</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o!.id} className="border-b border-line last:border-0 hover:bg-fg/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg">{o!.customerName}</p>
                      <p className="mt-0.5 font-mono text-[12px] text-fg-subtle">{orderRef(o!.id)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o!.status} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-fg-muted">
                      <p className="max-w-[28ch] truncate">{o!.pickupAddress}</p>
                      <p className="max-w-[28ch] truncate">→ {o!.dropoffAddress}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                      ${(o!.priceCents / 100).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] text-fg-muted">
                      {new Date(o!.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/merchant/orders/${o!.id}`} className="text-accent hover:underline">
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState
            title={all.length ? "Nothing in this view" : "No orders yet"}
            hint={
              all.length
                ? "Try another filter — your other deliveries are still there."
                : 'Book your first delivery from "New delivery" and it goes out to nearby couriers within seconds.'
            }
          />
        )}
      </Card>
    </div>
  );
}
