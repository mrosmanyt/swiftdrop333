"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Courier {
  id: string;
  email: string;
  tier: string;
  isOnline: boolean;
}

/**
 * Manual dispatch override — when an order is stuck (nobody online in the
 * zone, a VIP delivery, a courier who went dark), ops can force it onto a
 * specific courier or pull it back into the queue.
 */
export default function AdminOrderActions({
  orderId,
  status,
  couriers,
}: {
  orderId: string;
  status: string;
  couriers: Courier[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [courierId, setCourierId] = useState(couriers[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}/${path}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Action failed.");
      return;
    }
    router.refresh();
  }

  const assignable = ["PENDING", "ASSIGNED"].includes(status);
  const unassignable = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {assignable && (
        <>
          <select
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            className="rounded-lg border border-gray-300 p-1.5 text-xs"
          >
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.email} · {c.tier} {c.isOnline ? "· online" : ""}
              </option>
            ))}
          </select>
          <button
            disabled={busy || !courierId}
            onClick={() => call("assign", { courierId })}
            className="rounded-lg bg-brand px-2 py-1 text-xs text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Force assign
          </button>
        </>
      )}
      {unassignable && (
        <button
          disabled={busy}
          onClick={() => call("unassign")}
          className="rounded-lg border border-orange-200 px-2 py-1 text-xs text-orange-700 hover:bg-orange-50 disabled:opacity-50"
        >
          Unassign & requeue
        </button>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
