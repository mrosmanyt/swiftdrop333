"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Merchant-side "cancel this delivery" control — only rendered by the
 * caller when the order is still PENDING/ASSIGNED (the API enforces the
 * same rule either way, this just avoids showing a button that would 409). */
export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!reason.trim()) {
      setError("A short reason helps us and the customer both.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't cancel this order.");
      return;
    }
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-danger/30 px-3 py-1.5 text-[13px] font-medium text-danger hover:bg-danger-soft"
      >
        Cancel order
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-danger/30 bg-danger-soft/40 p-3.5">
      <p className="text-[13px] font-medium text-fg">Cancel this delivery?</p>
      <p className="mt-0.5 text-[12px] text-fg-muted">
        Only works before a courier picks it up. The customer is notified automatically.
      </p>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (e.g. customer changed their mind)"
        className="mt-2 w-full rounded-lg border border-line bg-bg p-2 text-[13px] outline-none focus:border-accent"
      />
      {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
      <div className="mt-2.5 flex gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-lg bg-danger-solid px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Cancelling…" : "Yes, cancel it"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={busy}
          className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-fg-muted hover:bg-fg/5"
        >
          Never mind
        </button>
      </div>
    </div>
  );
}
