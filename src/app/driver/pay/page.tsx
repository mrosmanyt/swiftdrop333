import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getCourierProfileByUserId, courierPayTransparency } from "@/lib/repo";
import SupportWidget from "@/components/SupportWidget";

/**
 * Pay transparency statement.
 *
 * Ontario's Digital Platform Workers' Rights Act requires platforms to
 * tell couriers plainly how pay is calculated and how much time they
 * actually worked. This page is that disclosure — and it's also just a
 * good reason for couriers to trust the platform.
 */
export default async function DriverPayPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "COURIER") redirect("/login");

  const courier = getCourierProfileByUserId(user.id);
  if (!courier) return <p>No courier profile found.</p>;

  const p14 = courierPayTransparency(courier.id, 14);
  const p90 = courierPayTransparency(courier.id, 90);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your pay, explained</h1>
        <p className="text-sm text-fg-muted">
          Everything below is calculated from your own completed deliveries — no estimates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PeriodCard title="Last 14 days" p={p14} />
        <PeriodCard title="Last 90 days" p={p90} />
      </div>

      <div className="rounded-xl border border-line bg-surface p-4 text-sm">
        <p className="font-semibold">How your pay is calculated</p>
        <ul className="mt-2 space-y-2 text-fg-muted">
          <li>
            <span className="font-medium">Per delivery:</span> a base rate for the zone, plus a
            per-kilometre amount for the distance, multiplied by the service type (Batch is lower,
            Direct is higher) and by any surge multiplier in effect when the order was created.
          </li>
          <li>
            <span className="font-medium">Your share:</span> you receive 72% of the delivery fee.
            SwiftDrop keeps 28% to run the platform. Surge raises the whole fee, so your share goes
            up with it.
          </li>
          <li>
            <span className="font-medium">Tier bonus:</span> Silver +5¢, Gold +10¢, Pro +20¢ per
            delivery, on top of your share.
          </li>
          <li>
            <span className="font-medium">Challenges:</span> completed bonus campaigns are paid in
            full on top of delivery earnings.
          </li>
          <li>
            <span className="font-medium">Cash out:</span> weekly payouts are free; instant cash-out
            costs 1.5% of the amount.
          </li>
          <li>
            <span className="font-medium">Engaged time</span> is measured from accepting a delivery
            to completing it. Time spent waiting for offers isn&apos;t counted as engaged time.
          </li>
        </ul>
        <p className="mt-3 text-xs text-fg-subtle">
          You&apos;re an independent contractor, so income tax and any HST obligations are yours to
          handle — your earnings history above is what you&apos;ll need at tax time. If a payment
          looks wrong, raise it with support and we&apos;ll investigate.
        </p>
      </div>

      <div>
        <SupportWidget />
      </div>
    </div>
  );
}

function PeriodCard({ title, p }: { title: string; p: any }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="font-semibold">{title}</p>
      <dl className="mt-2 space-y-1 text-sm">
        <Row label="Deliveries completed" value={p.deliveries} />
        <Row
          label="Engaged time"
          value={p.engagedHours >= 1 ? `${p.engagedHours} h` : `${p.engagedMinutes} min`}
        />
        <Row label="Delivery earnings" value={`$${(p.deliveryEarningsCents / 100).toFixed(2)}`} />
        <Row label="Bonuses" value={`$${(p.bonusCents / 100).toFixed(2)}`} />
        <Row label="Total" value={`$${(p.totalCents / 100).toFixed(2)}`} strong />
        <Row
          label="Effective hourly"
          value={p.effectiveHourlyCents ? `$${(p.effectiveHourlyCents / 100).toFixed(2)}/h` : "—"}
          strong
        />
      </dl>
      {p.rateUnavailableReason && (
        <p className="mt-2 text-xs text-fg-subtle">{p.rateUnavailableReason}</p>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string | number; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-line/60 py-1">
      <dt className="text-fg-muted">{label}</dt>
      <dd className={strong ? "font-semibold" : ""}>{value}</dd>
    </div>
  );
}
