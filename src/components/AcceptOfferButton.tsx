"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AcceptOfferButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/accept`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not accept — try again.");
      router.refresh();
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        onClick={accept}
        disabled={loading}
        className="rounded-lg bg-accent-solid px-3 py-1 text-sm text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Accepting…" : "Accept"}
      </button>
      {error && <p className="mt-1 max-w-[160px] text-xs text-danger">{error}</p>}
    </div>
  );
}
