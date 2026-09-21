"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddressInput, { PickedAddress } from "@/components/AddressInput";

interface Zone {
  id: string;
  city: string;
  name: string;
  baseRateCents: number;
  perKmCents: number;
}

const EMPTY: PickedAddress = { label: "", lat: null, lng: null };

/** Time windows a merchant can promise the customer. */
const WINDOWS = [
  { id: "asap", label: "As soon as possible" },
  { id: "09-12", label: "Morning (9am – 12pm)", start: 9, end: 12 },
  { id: "12-15", label: "Midday (12pm – 3pm)", start: 12, end: 15 },
  { id: "15-18", label: "Afternoon (3pm – 6pm)", start: 15, end: 18 },
  { id: "18-21", label: "Evening (6pm – 9pm)", start: 18, end: 21 },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [pickup, setPickup] = useState<PickedAddress>(EMPTY);
  const [dropoff, setDropoff] = useState<PickedAddress>(EMPTY);
  const [windowId, setWindowId] = useState("asap");
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then((data) => setZones(data.zones ?? []));
  }, []);

  function buildWindow() {
    const w = WINDOWS.find((x) => x.id === windowId);
    if (!w || w.start === undefined) return { windowStart: undefined, windowEnd: undefined };
    const start = new Date(`${deliveryDate}T00:00:00`);
    start.setHours(w.start, 0, 0, 0);
    const end = new Date(`${deliveryDate}T00:00:00`);
    end.setHours(w.end!, 0, 0, 0);
    return { windowStart: start.toISOString(), windowEnd: end.toISOString() };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const form = new FormData(e.currentTarget);
    const { windowStart, windowEnd } = buildWindow();

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zoneId: form.get("zoneId"),
        pickupAddress: pickup.label || form.get("pickupAddress"),
        pickupLat: pickup.lat ?? undefined,
        pickupLng: pickup.lng ?? undefined,
        dropoffAddress: dropoff.label || form.get("dropoffAddress"),
        dropoffLat: dropoff.lat ?? undefined,
        dropoffLng: dropoff.lng ?? undefined,
        customerName: form.get("customerName"),
        customerPhone: form.get("customerPhone") || undefined,
        customerEmail: form.get("customerEmail") || undefined,
        deliveryInstructions: form.get("deliveryInstructions") || undefined,
        serviceType: form.get("serviceType"),
        windowStart,
        windowEnd,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setError(typeof data.error === "string" ? data.error : "Check the form and try again.");
      return;
    }
    const { orderId } = await res.json();
    router.push(`/merchant/orders/${orderId}`);
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">New delivery</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm">
          Zone
          <select name="zoneId" required className="mt-1 w-full rounded-lg border border-gray-300 p-2">
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.city} — {z.name} (from ${(z.baseRateCents / 100).toFixed(2)})
              </option>
            ))}
          </select>
          {!zones.length && <span className="text-xs text-gray-400">Loading zones…</span>}
        </label>

        <AddressInput label="Pickup address" name="pickupAddress" onChange={setPickup} />
        <AddressInput label="Dropoff address" name="dropoffAddress" onChange={setDropoff} />

        <Field name="customerName" label="Customer name" />
        <Field name="customerPhone" label="Customer phone" required={false} />
        <Field name="customerEmail" label="Customer email" type="email" required={false} />
        <Field name="deliveryInstructions" label="Delivery instructions (gate code, side door…)" required={false} />

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Delivery date
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2"
            />
          </label>
          <label className="block text-sm">
            Time window
            <select
              value={windowId}
              onChange={(e) => setWindowId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2"
            >
              {WINDOWS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm">
          Service type
          <select name="serviceType" className="mt-1 w-full rounded-lg border border-gray-300 p-2">
            <option value="SAME_DAY">Same Day</option>
            <option value="NEXT_DAY">Next Day</option>
            <option value="DIRECT">Direct (exclusive courier)</option>
            <option value="BATCH">Batch (cheapest, multi-stop)</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={status === "submitting" || !zones.length}
          className="w-full rounded-lg bg-brand py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {status === "submitting" ? "Creating…" : "Create delivery"}
        </button>

        {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-300 p-2"
      />
    </label>
  );
}
