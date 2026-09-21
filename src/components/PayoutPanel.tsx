"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Cash-out panel: weekly is free, instant charges a small fee. */
export default function PayoutPanel() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [fee, setFee] = useState(1.5);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/couriers/me/payouts");
    if (!res.ok) return;
    const data = await res.json();
    setSummary(data.summary);
    setFee(data.instantFeePercent);
  }

  useEffect(() => {
    load();
  }, []);

  async function request(method: "instant" | "weekly") {
    const cents = Math.round(Number(amount) * 100);
    if (!cents || cents <= 0) {
      setError("Enter an amount.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/couriers/me/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: cents, method }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not request payout.");
      return;
    }
    const data = await res.json();
    setDone(
      method === "instant"
        ? `Requested $${(cents / 100).toFixed(2)} instantly (fee $${(data.feeCents / 100).toFixed(2)}).`
        : `Requested $${(cents / 100).toFixed(2)} in the next weekly payout.`
    );
    setAmount("");
    load();
    router.refresh();
  }

  if (!summary) return null;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="font-semibold">Cash out</p>
      <p className="mt-1 text-sm text-fg-muted">
        ${(summary.availableCents / 100).toFixed(2)} available. Weekly payout is free; instant costs {fee}%.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="w-32 rounded-lg border border-line p-2 text-sm"
        />
        <button
          onClick={() => request("instant")}
          disabled={busy}
          className="rounded-lg bg-accent-solid px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          Instant
        </button>
        <button
          onClick={() => request("weekly")}
          disabled={busy}
          className="rounded-lg border border-line px-3 py-2 text-sm text-fg-muted hover:bg-bg-soft disabled:opacity-50"
        >
          Add to weekly
        </button>
        <button
          onClick={() => setAmount((summary.availableCents / 100).toFixed(2))}
          className="text-xs text-accent hover:underline"
        >
          Max
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {done && <p className="mt-2 text-xs text-ok">{done}</p>}
      <p className="mt-2 text-xs text-fg-subtle">
        Payouts are reviewed by the SwiftDrop team — a payment provider isn&apos;t connected yet.
      </p>
    </div>
  );
}
