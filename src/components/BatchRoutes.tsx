"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Batch {
  id: string;
  stopCount: number;
  totalKm: number;
  totalCourierFeeCents: number;
  orders: { id: string; sequence: number; dropoffAddress: string; customerName: string }[];
}

/**
 * Optimized multi-stop routes a courier can take in one tap. The stop
 * order shown is the optimized sequence — following it is what makes the
 * per-delivery pay work out better than doing the same drops ad hoc.
 */
export default function BatchRoutes() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/batches");
    if (!res.ok) return;
    const data = await res.json();
    setBatches(data.batches ?? []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  async function accept(id: string) {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/batches/${id}/accept`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not take this route.");
      load();
      return;
    }
    router.push("/driver/offers");
    router.refresh();
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Batch routes</h2>
      {!batches.length && (
        <p className="text-sm text-fg-subtle">
          No multi-stop routes available right now. Pro and Gold couriers see new ones first.
        </p>
      )}
      <div className="space-y-3">
        {batches.map((b) => (
          <div key={b.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {b.stopCount} stops · {b.totalKm?.toFixed(1)} km optimized route
                </p>
                <p className="text-xs text-fg-muted">
                  ${((b.totalCourierFeeCents / b.stopCount / 100) || 0).toFixed(2)} avg per stop
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-accent">
                  ${(b.totalCourierFeeCents / 100).toFixed(2)}
                </p>
              </div>
            </div>

            <ol className="mt-3 space-y-1 text-xs text-fg-muted">
              {b.orders.map((o) => (
                <li key={o.id}>
                  <span className="mr-2 inline-block h-4 w-4 rounded-full bg-accent/10 text-center text-[10px] font-semibold leading-4 text-accent">
                    {o.sequence}
                  </span>
                  {o.dropoffAddress} — {o.customerName}
                </li>
              ))}
            </ol>

            <button
              onClick={() => accept(b.id)}
              disabled={busy === b.id}
              className="mt-3 w-full rounded-lg bg-accent-solid px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy === b.id ? "Taking route…" : `Take all ${b.stopCount} stops`}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
