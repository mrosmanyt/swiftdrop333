"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Help button available to everyone — including a customer with no account
 * on their tracking link, so a delivery problem never dead-ends. Tickets
 * land straight in the admin Support queue.
 */
export default function SupportWidget({
  orderId,
  needsEmail = false,
  labels,
}: {
  orderId?: string;
  needsEmail?: boolean;
  labels?: { title?: string; subject?: string; message?: string; email?: string; submit?: string; sent?: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const L = {
    title: labels?.title ?? "Need help?",
    subject: labels?.subject ?? "Subject",
    message: labels?.message ?? "What's going on?",
    email: labels?.email ?? "Your email",
    submit: labels?.submit ?? "Send to support",
    sent: labels?.sent ?? "Thanks — our team will get back to you.",
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.get("category"),
        subject: form.get("subject"),
        body: form.get("body"),
        orderId,
        contactEmail: form.get("contactEmail") || undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not send — check the form.");
      return;
    }
    const data = await res.json();
    setReference(data.reference);
    // The "Your tickets" list on this page (merchant/driver support pages)
    // is fetched server-side on initial render; refresh so the new ticket
    // shows up immediately instead of only after a manual reload.
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-accent hover:underline"
      >
        {L.title}
      </button>
    );
  }

  if (reference) {
    return (
      <div className="rounded-xl border border-ok/30 bg-ok-soft p-4 text-sm text-ok">
        <p>{L.sent}</p>
        <p className="mt-1 text-xs">Reference: {reference}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">{L.title}</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-fg-subtle">
          Close
        </button>
      </div>

      <select name="category" className="w-full rounded-lg border border-line p-2 text-sm">
        <option value="delivery">Delivery problem</option>
        <option value="payment">Payment</option>
        <option value="account">Account</option>
        <option value="app">App issue</option>
        <option value="other">Something else</option>
      </select>

      <input
        name="subject"
        required
        placeholder={L.subject}
        className="w-full rounded-lg border border-line p-2 text-sm"
      />
      <textarea
        name="body"
        required
        rows={3}
        placeholder={L.message}
        className="w-full rounded-lg border border-line p-2 text-sm"
      />
      {needsEmail && (
        <input
          name="contactEmail"
          type="email"
          required
          placeholder={L.email}
          className="w-full rounded-lg border border-line p-2 text-sm"
        />
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-accent-solid py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Sending…" : L.submit}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
