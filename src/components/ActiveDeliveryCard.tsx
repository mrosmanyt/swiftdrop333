"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUS_LABEL } from "@/lib/types";

interface Order {
  id: string;
  status: "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "RETURNING" | string;
  pickupAddress: string;
  dropoffAddress: string;
  customerName: string;
  deliveryInstructions?: string | null;
  courierFeeCents: number;
  failureReason?: string | null;
}

/**
 * One in-progress delivery, with the actions that actually move it forward:
 * accept → picked up → (optional) in transit → delivered (photo required).
 * Every click hits a real API route and refreshes the page's server data.
 */
export default function ActiveDeliveryCard({ order }: { order: Order }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  async function post(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/orders/${order.id}/${path}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleDeliver() {
    if (!file) {
      setError("Attach a proof-of-delivery photo first.");
      return;
    }
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
    if (!uploadRes.ok) {
      setBusy(false);
      setError("Photo upload failed.");
      return;
    }
    const { url } = await uploadRes.json();
    await post("deliver", { proofOfDeliveryUrl: url });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{order.customerName}</p>
          <p className="text-sm text-gray-500">{order.pickupAddress} → {order.dropoffAddress}</p>
          {order.deliveryInstructions && (
            <p className="mt-1 text-xs text-gray-400">Note: {order.deliveryInstructions}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-brand">${(order.courierFeeCents / 100).toFixed(2)}</p>
          <span className="text-xs text-gray-400">{ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {order.status === "ASSIGNED" && (
          <button
            disabled={busy}
            onClick={() => post("picked-up")}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Mark picked up
          </button>
        )}

        {(order.status === "PICKED_UP" || order.status === "IN_TRANSIT") && (
          <>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-xs"
            />
            <button
              disabled={busy}
              onClick={handleDeliver}
              className="rounded-lg bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Mark delivered"}
            </button>
          </>
        )}

        {order.status === "RETURNING" && (
          <button
            disabled={busy}
            onClick={() => post("returned")}
            className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
          >
            Confirm returned to merchant
          </button>
        )}

        {order.status !== "RETURNING" && (
          <button
            disabled={busy}
            onClick={() => {
              const reason = window.prompt(
                "Why couldn't it be delivered? (customer not home, wrong address, refused…)"
              );
              if (reason) {
                // Before pickup there's nothing to bring back, so it's a
                // plain failure; after pickup the parcel must go back to
                // the merchant.
                post(order.status === "ASSIGNED" ? "fail" : "returning", { reason });
              }
            }}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Can&apos;t deliver
          </button>
        )}
      </div>

      {order.status === "RETURNING" && (
        <p className="mt-2 rounded-lg bg-orange-50 p-2 text-xs text-orange-800">
          Return this parcel to {order.pickupAddress}
          {order.failureReason ? ` — reason logged: ${order.failureReason}` : ""}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
