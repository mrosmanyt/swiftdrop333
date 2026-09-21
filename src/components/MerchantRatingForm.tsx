"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The courier's side of two-way ratings: how was the pickup? Long waits,
 * bad packaging and unhelpful staff all cost courier time, and this is
 * how that gets measured instead of quietly eaten.
 */
export default function MerchantRatingForm({
  orderId,
  merchantName,
}: {
  orderId: string;
  merchantName: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!rating) {
      setError("Pick a rating first.");
      return;
    }
    const res = await fetch(`/api/orders/${orderId}/rate-merchant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment || undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not submit.");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) return <p className="text-xs text-ok">Thanks — pickup feedback recorded.</p>;

  return (
    <div className="mt-2 rounded-lg border border-line bg-bg-soft p-3">
      <p className="text-xs font-medium text-fg-muted">Rate the pickup at {merchantName}</p>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex gap-0.5 text-lg">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              aria-label={`${n} star`}
              className={n <= rating ? "text-warn" : "text-fg-subtle"}
            >
              ★
            </button>
          ))}
        </div>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Waited 20 min…"
          className="flex-1 rounded-lg border border-line px-2 py-1 text-xs"
        />
        <button
          onClick={submit}
          className="rounded-lg bg-neutral-solid px-2 py-1 text-xs text-white hover:opacity-90"
        >
          Submit
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
