"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Ops control panel: run batching, set surge, launch courier challenges,
 * and process payout requests.
 */
export default function OperationsPanel({
  zones,
  challenges,
  payouts,
  openBatches,
}: {
  zones: any[];
  challenges: any[];
  payouts: any[];
  openBatches: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function runBatching() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/batching", { method: "POST" });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setBatchResult(data);
      router.refresh();
    }
  }

  async function setSurge(zoneId: string, multiplier: number, note: string) {
    setBusy(true);
    await fetch("/api/admin/surge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zoneId, multiplier, note }),
    });
    setBusy(false);
    setMessage(`Surge updated to ${multiplier}×`);
    router.refresh();
  }

  async function createChallenge(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description") || undefined,
        targetDeliveries: Number(form.get("target")),
        bonusCents: Math.round(Number(form.get("bonus")) * 100),
        startsAt: new Date(String(form.get("startsAt"))).toISOString(),
        endsAt: new Date(String(form.get("endsAt"))).toISOString(),
        minTier: form.get("minTier"),
      }),
    });
    setBusy(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      setMessage("Challenge launched");
      router.refresh();
    }
  }

  async function processPayout(requestId: string, status: string) {
    setBusy(true);
    await fetch("/api/admin/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });
    setBusy(false);
    router.refresh();
  }

  const pendingPayouts = payouts.filter((p) => p.status === "requested");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Operations</h1>
        {message && <p className="mt-1 text-sm text-ok">{message}</p>}
      </div>

      {/* Batching */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Route batching</h2>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-sm text-fg-muted">
            Clusters nearby pending drop-offs into multi-stop routes and optimizes the stop order
            (nearest-neighbour + 2-opt). {openBatches} open route(s) waiting for a courier.
          </p>
          <button
            onClick={runBatching}
            disabled={busy}
            className="mt-3 rounded-lg bg-accent-solid px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Running…" : "Run batching pass"}
          </button>

          {batchResult && (
            <div className="mt-3 rounded-lg bg-bg-soft p-3 text-sm">
              <p>
                Considered {batchResult.considered} orders · created{" "}
                <span className="font-medium">{batchResult.batchesCreated}</span> route(s)
              </p>
              {batchResult.batches?.map((b: any) => (
                <p key={b.batchId} className="mt-1 text-xs text-fg-muted">
                  {b.stops} stops · {b.totalKm} km ·{" "}
                  <span className="font-medium text-ok">{b.savingsPercent}% shorter</span> than
                  unordered
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Surge */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Surge pricing</h2>
        <div className="space-y-2">
          {zones.map((z) => (
            <div key={z.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface p-3">
              <div>
                <p className="font-medium">
                  {z.city} — {z.name}
                </p>
                <p className="text-xs text-fg-muted">
                  Currently {z.surgeMultiplier}×{z.surgeNote ? ` · ${z.surgeNote}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                {[1, 1.25, 1.5, 2].map((m) => (
                  <button
                    key={m}
                    disabled={busy}
                    onClick={() => setSurge(z.id, m, m > 1 ? "High demand" : "")}
                    className={`rounded-lg px-2 py-1 text-xs ${
                      z.surgeMultiplier === m
                        ? "bg-accent-solid text-white"
                        : "border border-line text-fg-muted hover:bg-bg-soft"
                    }`}
                  >
                    {m}×
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-fg-subtle">
          Surge raises the whole fare, so the courier&apos;s share rises with it — that&apos;s what
          pulls couriers online in bad weather.
        </p>
      </section>

      {/* Challenges */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Courier challenges</h2>
        <form onSubmit={createChallenge} className="mb-3 grid gap-2 rounded-xl border border-line bg-surface p-4 sm:grid-cols-3">
          <Field name="title" label="Title" placeholder="Weekend push" />
          <Field name="target" label="Deliveries" type="number" placeholder="15" />
          <Field name="bonus" label="Bonus ($)" type="number" step="0.01" placeholder="30" />
          <Field name="startsAt" label="Starts" type="datetime-local" />
          <Field name="endsAt" label="Ends" type="datetime-local" />
          <label className="text-xs text-fg-muted">
            Minimum tier
            <select name="minTier" className="mt-1 block w-full rounded-lg border border-line p-2 text-sm">
              <option value="STARTER">All couriers</option>
              <option value="SILVER">Silver+</option>
              <option value="GOLD">Gold+</option>
              <option value="PRO">Pro only</option>
            </select>
          </label>
          <Field name="description" label="Description" placeholder="Extra $30 for 15 weekend drops" />
          <button
            type="submit"
            disabled={busy}
            className="self-end rounded-lg bg-accent-solid px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            Launch challenge
          </button>
        </form>

        <div className="space-y-1">
          {challenges.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-line bg-surface p-2 text-sm">
              <span>
                {c.title} — {c.target_deliveries} deliveries for ${(c.bonus_cents / 100).toFixed(2)}
              </span>
              <span className="text-xs text-fg-subtle">
                ends {new Date(c.ends_at).toLocaleDateString()} · {c.min_tier}+
              </span>
            </div>
          ))}
          {!challenges.length && <p className="text-sm text-fg-subtle">No challenges yet.</p>}
        </div>
      </section>

      {/* Payouts */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">
          Payout requests {pendingPayouts.length > 0 && <span className="text-accent">({pendingPayouts.length})</span>}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="text-fg-subtle">
              <tr>
                <th className="p-3">Courier</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Fee</th>
                <th className="p-3">Method</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-3 text-xs">{p.courierEmail}</td>
                  <td className="p-3">${(p.amount_cents / 100).toFixed(2)}</td>
                  <td className="p-3 text-xs text-fg-muted">
                    {p.fee_cents ? `$${(p.fee_cents / 100).toFixed(2)}` : "—"}
                  </td>
                  <td className="p-3 text-xs">{p.method}</td>
                  <td className="p-3 text-xs">{p.status}</td>
                  <td className="p-3 text-right">
                    {p.status === "requested" && (
                      <div className="flex justify-end gap-1">
                        <button
                          disabled={busy}
                          onClick={() => processPayout(p.id, "paid")}
                          className="rounded-lg bg-ok-solid px-2 py-1 text-xs text-white hover:opacity-90"
                        >
                          Mark paid
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => processPayout(p.id, "rejected")}
                          className="rounded-lg border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger-soft"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!payouts.length && (
                <tr>
                  <td className="p-3 text-fg-subtle" colSpan={6}>
                    No payout requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  step,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="text-xs text-fg-muted">
      {label}
      <input
        name={name}
        type={type}
        step={step}
        placeholder={placeholder}
        required
        className="mt-1 block w-full rounded-lg border border-line p-2 text-sm text-fg"
      />
    </label>
  );
}
