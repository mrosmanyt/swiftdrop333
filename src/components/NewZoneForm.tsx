"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewZoneForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: form.get("city"),
        name: form.get("name"),
        baseRateCents: Math.round(Number(form.get("baseRate")) * 100),
        perKmCents: Math.round(Number(form.get("perKm")) * 100),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not create zone — check the values.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent-solid px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
      >
        + New zone
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3"
    >
      <Field name="city" label="City" placeholder="Toronto" />
      <Field name="name" label="Zone name" placeholder="Downtown Core" />
      <Field name="baseRate" label="Base rate ($)" placeholder="8.99" type="number" step="0.01" />
      <Field name="perKm" label="Per km ($)" placeholder="0.50" type="number" step="0.01" />
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-accent-solid px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-fg-muted">
        Cancel
      </button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  step,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  step?: string;
}) {
  return (
    <label className="text-xs text-fg-muted">
      {label}
      <input
        name={name}
        type={type}
        step={step}
        placeholder={placeholder}
        required
        className="mt-1 block w-32 rounded-lg border border-line p-1.5 text-sm text-fg"
      />
    </label>
  );
}
