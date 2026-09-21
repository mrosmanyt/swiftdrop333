"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/portal/ui";

interface Address {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

export default function CustomerAddressesPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/customer/addresses");
    const data = await res.json();
    setAddresses(data.addresses ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/customer/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.get("label") || "Home",
        address: form.get("address"),
        isDefault: !addresses?.length, // first address saved becomes the default automatically
      }),
    });

    setBusy(false);
    if (!res.ok) {
      setError("Couldn't save that address — check the fields and try again.");
      return;
    }
    (e.target as HTMLFormElement).reset();
    await load();
  }

  async function handleDelete(id: string) {
    setBusy(true);
    await fetch(`/api/customer/addresses/${id}`, { method: "DELETE" });
    setBusy(false);
    await load();
  }

  async function handleSetDefault(id: string) {
    setBusy(true);
    await fetch(`/api/customer/addresses/${id}/default`, { method: "POST" });
    setBusy(false);
    await load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Saved Addresses" subtitle="Keep your regular drop-off spots handy for next time." />

      <Card title="Add an address" bodyClassName="p-4">
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm">
            Label
            <input
              name="label"
              placeholder="Home, Work…"
              className="mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg outline-none transition focus:border-accent"
            />
          </label>
          <label className="block flex-[2] text-sm">
            Address
            <input
              name="address"
              required
              placeholder="123 Main St, Toronto, ON"
              className="mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg outline-none transition focus:border-accent"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-inverse px-4 py-2.5 font-medium text-inverse-fg transition hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <Card bodyClassName="">
        {addresses === null ? (
          <p className="p-4 text-sm text-fg-muted">Loading…</p>
        ) : addresses.length ? (
          <ul className="divide-y divide-line">
            {addresses.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 font-medium text-fg">
                    {a.label}
                    {a.isDefault && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[13px] text-fg-muted">{a.address}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[13px]">
                  {!a.isDefault && (
                    <button onClick={() => handleSetDefault(a.id)} className="text-accent hover:underline" disabled={busy}>
                      Make default
                    </button>
                  )}
                  <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:underline" disabled={busy}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No saved addresses yet" hint="Add one above so it's ready next time you place an order." />
        )}
      </Card>
    </div>
  );
}
