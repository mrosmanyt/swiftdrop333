"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Permanently anonymise a deleted account (privacy / deletion request). */
export default function AdminEraseButton({ userId, label }: { userId: string; label: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function erase() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/erase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erase failed.");
      return;
    }
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger-soft"
      >
        Erase personal data
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-fg-muted">Erase {label} for good?</span>
      <button
        disabled={busy}
        onClick={erase}
        className="rounded-lg bg-danger-solid px-2 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Erasing…" : "Yes, erase"}
      </button>
      <button onClick={() => setConfirming(false)} className="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted">
        Cancel
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </span>
  );
}
