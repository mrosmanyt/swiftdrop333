import RecentDeliveries from "@/components/RecentDeliveries";
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
} from "@/components/portal/ui";

const ACTIVE = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];

export default async function MerchantDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "MERCHANT") redirect("/login");

  const merchant = await getMerchantProfileByUserId(user.id);
  const orders = merchant ? await listOrdersForMerchant(merchant.id, 200) : [];
  const blockReason = await merchantBlockReason(merchant);

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
          <RecentDeliveries orders={recent.filter((order): order is NonNullable<typeof order> => order != null)} />
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
