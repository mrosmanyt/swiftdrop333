"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Used on /admin/deleted-records to bring a soft-deleted record back. */
export default function AdminRestoreButton({
  resource,
  id,
}: {
  resource: "merchants" | "couriers" | "orders";
  id: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doRestore() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/${resource}/${id}/restore`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Restore failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={busy}
        onClick={doRestore}
        className="rounded-lg bg-ok-solid px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        Restore
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
