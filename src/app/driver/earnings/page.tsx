import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import {
  getCourierProfileByUserId,
  listDeliveredOrdersForCourier,
  computeCourierStats14d,
  courierEarningsSummary,
  listChallengeClaims,
  listPayoutRequests,
  refreshCourierTier,
} from "@/lib/repo";
import { TIER_BONUS_CENTS, nextTierProgress } from "@/lib/pricing";
import PayoutPanel from "@/components/PayoutPanel";
import ChallengeList from "@/components/ChallengeList";

export default async function DriverEarningsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "COURIER") redirect("/login");

  const courier = getCourierProfileByUserId(user.id);
  if (!courier) return <p>No courier profile found.</p>;

  const delivered = listDeliveredOrdersForCourier(courier.id, 200);
  const stats = computeCourierStats14d(courier.id);
  const progress = nextTierProgress(stats);
  // Keep the stored tier honest with what the last 14 days actually earned,
  // so the badge and the "x more to reach y" line can never disagree.
  const tier = refreshCourierTier(courier.id);
  const summary = courierEarningsSummary(courier.id);
  const claims = listChallengeClaims(courier.id);
  const payouts = listPayoutRequests(courier.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Earnings</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Available to cash out" value={`$${(summary.availableCents / 100).toFixed(2)}`} highlight />
        <Stat label="Delivery earnings" value={`$${(summary.deliveryEarningsCents / 100).toFixed(2)}`} />
        <Stat label="Bonuses earned" value={`$${(summary.bonusCents / 100).toFixed(2)}`} />
        <Stat label="Deliveries" value={summary.deliveries} />
      </div>

      <div className="rounded-xl border border-accent/25 bg-accent/10/30 p-4">
        <p className="font-medium text-accent">
          Current tier: {tier} (+{TIER_BONUS_CENTS[tier]}¢/delivery)
        </p>
        <p className="mt-1 text-sm text-fg-muted">{progress.message}</p>
        <p className="mt-1 text-xs text-fg-subtle">
          Last 14 days: {stats.deliveries} deliveries · {Math.round(stats.completionRate * 100)}% completion rate
        </p>
      </div>

      <ChallengeList />

      <PayoutPanel />

      <div className="rounded-xl border border-line bg-surface">
        <div className="border-b border-line p-4 font-semibold">Payout history</div>
        <table className="w-full text-left text-sm">
          <thead className="text-fg-subtle">
            <tr>
              <th className="p-3">Requested</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Fee</th>
              <th className="p-3">Method</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-3">${(p.amount_cents / 100).toFixed(2)}</td>
                <td className="p-3 text-xs text-fg-muted">
                  {p.fee_cents ? `$${(p.fee_cents / 100).toFixed(2)}` : "—"}
                </td>
                <td className="p-3 text-xs">{p.method}</td>
                <td className="p-3 text-xs">{p.status}</td>
              </tr>
            ))}
            {!payouts.length && (
              <tr>
                <td className="p-3 text-fg-subtle" colSpan={5}>
                  No payouts requested yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {claims.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="font-semibold">Bonuses claimed</p>
          <ul className="mt-2 space-y-1 text-sm text-fg-muted">
            {claims.map((c, i) => (
              <li key={i} className="flex justify-between border-b border-line/60 py-1">
                <span>{c.title}</span>
                <span className="font-medium text-ok">+${(c.bonusCents / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface">
        <div className="border-b border-line p-4 font-semibold">Recent deliveries</div>
        <table className="w-full text-left text-sm">
          <thead className="text-fg-subtle">
            <tr>
              <th className="p-3">Delivered</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Earned</th>
              <th className="p-3">Rating</th>
            </tr>
          </thead>
          <tbody>
            {delivered.slice(0, 15).map((o) => (
              <tr key={o!.id} className="border-t border-line">
                <td className="p-3">{o!.deliveredAt ? new Date(o!.deliveredAt).toLocaleDateString() : "—"}</td>
                <td className="p-3">{o!.customerName}</td>
                <td className="p-3">${(o!.courierFeeCents / 100).toFixed(2)}</td>
                <td className="p-3">{o!.customerRating ? `${o!.customerRating}★` : "—"}</td>
              </tr>
            ))}
            {!delivered.length && (
              <tr>
                <td className="p-3 text-fg-subtle" colSpan={4}>
                  No deliveries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-ok/30 bg-ok-soft" : "border-line bg-surface"}`}>
      <p className="text-sm text-fg-subtle">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${highlight ? "text-ok" : ""}`}>{value}</p>
    </div>
  );
}
