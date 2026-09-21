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
  refundStatus = "none",
}: {
  orderId: string;
  status: string;
  couriers: Courier[];
  refundStatus?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [courierId, setCourierId] = useState(couriers[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  async function call(path: string, body?: unknown, base = `/api/admin/orders/${orderId}`) {
    setBusy(true);
    setError(null);
    const res = await fetch(`${base}/${path}`, {
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

  async function cancel() {
    if (!cancelReason.trim()) {
      setError("Add a reason first.");
      return;
    }
    await call("cancel", { reason: cancelReason.trim() }, `/api/orders/${orderId}`);
    setCancelling(false);
    setCancelReason("");
  }

  async function refund(next: "refunded" | "denied") {
    const amount = window.prompt("Refund amount in dollars (leave blank if none):");
    if (amount === null) return;
    const amountCents = amount.trim() ? Math.round(parseFloat(amount) * 100) : undefined;
    await call("refund", { status: next, amountCents });
  }

  const assignable = ["PENDING", "ASSIGNED"].includes(status);
  const unassignable = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(status);
  const cancellable = ["PENDING", "ASSIGNED"].includes(status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {assignable && (
        <>
          <select
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            className="rounded-lg border border-line p-1.5 text-xs"
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
            className="rounded-lg bg-accent-solid px-2 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50"
          >
            Force assign
          </button>
        </>
      )}
      {unassignable && (
        <button
          disabled={busy}
          onClick={() => call("unassign")}
          className="rounded-lg border border-warn/30 px-2 py-1 text-xs text-warn hover:bg-warn-soft disabled:opacity-50"
        >
          Unassign & requeue
        </button>
      )}
      {cancellable && !cancelling && (
        <button
          disabled={busy}
          onClick={() => setCancelling(true)}
          className="rounded-lg border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger-soft disabled:opacity-50"
        >
          Cancel
        </button>
      )}
      {cancelling && (
        <div className="flex items-center gap-1.5">
          <input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason"
            className="w-32 rounded-lg border border-line p-1.5 text-xs"
          />
          <button
            disabled={busy}
            onClick={cancel}
            className="rounded-lg bg-danger-solid px-2 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            disabled={busy}
            onClick={() => setCancelling(false)}
            className="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted hover:bg-fg/5"
          >
            ✕
          </button>
        </div>
      )}
      {refundStatus === "pending" && (
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[11px] text-warn">Refund pending</span>
          <button
            disabled={busy}
            onClick={() => refund("refunded")}
            className="rounded-lg bg-ok-soft px-2 py-1 text-xs text-ok hover:opacity-80 disabled:opacity-50"
          >
            Mark refunded
          </button>
          <button
            disabled={busy}
            onClick={() => refund("denied")}
            className="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted hover:bg-fg/5 disabled:opacity-50"
          >
            Deny
          </button>
        </div>
      )}
      {refundStatus === "refunded" && (
        <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11px] text-ok">Refunded</span>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
