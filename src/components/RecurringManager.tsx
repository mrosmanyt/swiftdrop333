"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, TableWrap } from "@/components/portal/ui";

interface Zone {
  id: string;
  city: string;
  name: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The next calendar date this schedule will actually fire on, given today and its days-of-week — so "Mon/Wed/Fri" becomes something a merchant can plan around instead of mental math. */
function nextRunDate(daysOfWeek: string): string {
  const days = String(daysOfWeek)
    .split(",")
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  if (!days.length) return "—";
  const today = new Date();
  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    if (days.includes(d.getDay())) {
      return offset === 0
        ? "Today"
        : offset === 1
          ? "Tomorrow"
          : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    }
  }
  return "—";
}

/** Standing deliveries — e.g. a pharmacy sending to the same address every
 *  Mon/Wed/Fri. Orders are generated automatically on those days. */
export default function RecurringManager({ zones, defaultPickup }: { zones: Zone[]; defaultPickup: string }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/merchant/recurring");
    if (res.ok) setSchedules((await res.json()).schedules ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!days.length) {
      setError("Pick at least one day.");
      return;
    }
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/merchant/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.get("label"),
        zoneId: form.get("zoneId"),
        pickupAddress: form.get("pickupAddress"),
        dropoffAddress: form.get("dropoffAddress"),
        customerName: form.get("customerName"),
        customerPhone: form.get("customerPhone") || undefined,
        customerEmail: form.get("customerEmail") || "",
        deliveryInstructions: form.get("deliveryInstructions") || undefined,
        serviceType: form.get("serviceType"),
        daysOfWeek: days,
        windowHourStart: Number(form.get("windowHourStart")) || undefined,
        windowHourEnd: Number(form.get("windowHourEnd")) || undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not save schedule.");
      return;
    }
    (e.target as HTMLFormElement).reset();
    setOpen(false);
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/merchant/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    load();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recurring deliveries</h2>
        <button onClick={() => setOpen((v) => !v)} className="text-sm text-accent hover:underline">
          {open ? "Cancel" : "+ New schedule"}
        </button>
      </div>
      <p className="mb-3 text-[13px] text-fg-muted">
        Standing orders — set it once and a fresh delivery goes out automatically on the days you pick.
      </p>

      {open && (
        <form onSubmit={create} className="mb-3 space-y-3 rounded-xl border border-line bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="label" label="Label" placeholder="Mrs Chen — weekly meds" />
            <label className="block text-sm">
              Zone
              <select name="zoneId" className="mt-1 w-full rounded-lg border border-line p-2">
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.city} — {z.name}
                  </option>
                ))}
              </select>
            </label>
            <Field name="pickupAddress" label="Pickup address" defaultValue={defaultPickup} />
            <Field name="dropoffAddress" label="Dropoff address" />
            <Field name="customerName" label="Customer name" />
            <Field name="customerPhone" label="Customer phone" required={false} />
            <Field name="customerEmail" label="Customer email" required={false} />
            <Field name="deliveryInstructions" label="Instructions" required={false} />
            <label className="block text-sm">
              Service type
              <select name="serviceType" className="mt-1 w-full rounded-lg border border-line p-2">
                <option value="SAME_DAY">Same Day</option>
                <option value="NEXT_DAY">Next Day</option>
                <option value="BATCH">Batch</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Field name="windowHourStart" label="Window from (hour)" type="number" required={false} />
              <Field name="windowHourEnd" label="to (hour)" type="number" required={false} />
            </div>
          </div>

          <div>
            <p className="text-sm">Repeat on</p>
            <div className="mt-1 flex gap-1">
              {DAYS.map((d, i) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDay(i)}
                  className={`rounded-lg px-2 py-1 text-xs ${
                    days.includes(i) ? "bg-accent-solid text-white" : "bg-surface-2 text-fg-muted"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent-solid px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save schedule"}
          </button>
          {error && <p className="text-xs text-danger">{error}</p>}
        </form>
      )}

      <Card bodyClassName="">
        {schedules.length ? (
          <TableWrap>
            <table className="w-full text-left text-sm">
              <thead className="text-[12.5px] uppercase tracking-wide text-fg-subtle">
                <tr className="border-b border-line">
                  <th className="px-4 py-2.5 font-medium">Label</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Days</th>
                  <th className="px-4 py-2.5 font-medium">Next delivery</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-fg/[0.02]">
                    <td className="px-4 py-3 font-medium text-fg">{s.label}</td>
                    <td className="px-4 py-3 text-fg-muted">{s.customer_name}</td>
                    <td className="px-4 py-3 text-fg-muted">
                      {String(s.days_of_week)
                        .split(",")
                        .map((d: string) => DAYS[Number(d)])
                        .join(", ")}
                    </td>
                    <td className="px-4 py-3 font-medium text-fg">
                      {s.active ? nextRunDate(s.days_of_week) : "Paused"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          s.active ? "bg-ok-soft text-ok" : "bg-surface-2 text-fg-muted"
                        }`}
                      >
                        {s.active ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(s.id, !s.active)}
                        className={`text-[13px] hover:underline ${s.active ? "text-danger" : "text-accent"}`}
                      >
                        {s.active ? "Pause" : "Resume"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState title="No recurring schedules yet" hint="Set one up above for a customer who orders on a regular pattern." />
        )}
      </Card>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-line p-2"
      />
    </label>
  );
}
