"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Soft-delete button used on the admin merchants/couriers/orders tables.
 * The record isn't erased — it's moved into /admin/deleted-records and can
 * be brought back from there with AdminRestoreButton.
 */
export default function AdminDeleteButton({
  resource,
  id,
  label,
}: {
  resource: "merchants" | "couriers" | "orders";
  id: string;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function doDelete() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
    setBusy(false);
    setConfirming(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Delete failed.");
      return;
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-fg-muted">Delete {label}?</span>
        <button
          disabled={busy}
          onClick={doDelete}
          className="rounded-lg bg-danger-solid px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Yes, delete
        </button>
        <button
          disabled={busy}
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted hover:bg-surface-2"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger-soft"
      >
        Delete
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
