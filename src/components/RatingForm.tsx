"use client";

import { useState } from "react";

export default function RatingForm({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!rating) {
      setError("Pick a star rating first.");
      return;
    }
    const res = await fetch(`/api/orders/${orderId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment || undefined }),
    });
    if (!res.ok) {
      setError("Could not submit — this delivery may already be rated.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="mt-6 text-sm text-ok">Thanks for the feedback!</p>;
  }

  return (
    <div className="mt-6 rounded-xl border border-line p-4">
      <p className="text-sm font-medium">How was your delivery?</p>
      <div className="mt-2 flex gap-1 text-2xl">
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
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment"
        className="mt-2 w-full rounded-lg border border-line p-2 text-sm"
        rows={2}
      />
      <button
        onClick={submit}
        className="mt-2 rounded-lg bg-accent-solid px-3 py-1.5 text-sm text-white hover:opacity-90"
      >
        Submit
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
