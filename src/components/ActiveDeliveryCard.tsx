"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import OrderChat from "./OrderChat";
import MerchantRatingForm from "./MerchantRatingForm";

interface Order {
  id: string;
  status: "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "RETURNING" | string;
  pickupAddress: string;
  dropoffAddress: string;
  customerName: string;
  deliveryInstructions?: string | null;
  courierFeeCents: number;
  failureReason?: string | null;
  arrivedAtPickup?: string | null;
  merchantRating?: number | null;
  merchantBusinessName?: string | null;
  requiresAgeVerification?: boolean;
  ageVerifiedAt?: string | null;
  ageVerificationMethod?: string | null;
  temperatureRequirement?: string;
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
  const [chatOpen, setChatOpen] = useState(false);

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

  async function ageVerify(method: "id_checked" | "refused_underage" | "refused_no_id") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/orders/${order.id}/age-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, dobConfirmed: method === "id_checked" }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not record the ID check.");
      return;
    }
    const data = await res.json();
    if (data.mustReturn) {
      // Refused for age reasons — the parcel goes back, it can't be left.
      await post("returning", { reason: `Age verification failed (${method.replace(/_/g, " ")})` });
    }
    router.refresh();
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
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{order.customerName}</p>
          <p className="text-sm text-fg-muted">{order.pickupAddress} → {order.dropoffAddress}</p>
          {order.deliveryInstructions && (
            <p className="mt-1 text-xs text-fg-subtle">Note: {order.deliveryInstructions}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-accent">${(order.courierFeeCents / 100).toFixed(2)}</p>
          <span className="text-xs text-fg-subtle">{ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status}</span>
        </div>
      </div>

      {/* Compliance requirements the courier must see before setting off */}
      {(order.requiresAgeVerification || order.temperatureRequirement !== "ambient") && (
        <div className="mt-2 flex flex-wrap gap-2">
          {order.requiresAgeVerification && (
            <span className="rounded-full bg-info-soft px-2 py-0.5 text-xs font-medium text-info">
              🪪 ID check required
            </span>
          )}
          {order.temperatureRequirement === "cold" && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
              ❄️ Insulated bag — keep refrigerated
            </span>
          )}
          {order.temperatureRequirement === "frozen" && (
            <span className="rounded-full bg-info-soft px-2 py-0.5 text-xs font-medium text-info">
              🧊 Frozen — insulated bag required
            </span>
          )}
        </div>
      )}

      {/* Age verification must be recorded before delivery can complete */}
      {order.requiresAgeVerification &&
        !order.ageVerifiedAt &&
        ["PICKED_UP", "IN_TRANSIT"].includes(order.status) && (
          <div className="mt-2 rounded-lg border border-info/30 bg-info-soft p-3">
            <p className="text-xs font-medium text-info">
              Age-restricted delivery — check photo ID before handing over.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                disabled={busy}
                onClick={() => ageVerify("id_checked")}
                className="rounded-lg bg-info-solid px-2 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50"
              >
                ID checked — of age
              </button>
              <button
                disabled={busy}
                onClick={() => ageVerify("refused_underage")}
                className="rounded-lg border border-info/30 px-2 py-1 text-xs text-info hover:bg-info-soft disabled:opacity-50"
              >
                Refused — underage
              </button>
              <button
                disabled={busy}
                onClick={() => ageVerify("refused_no_id")}
                className="rounded-lg border border-info/30 px-2 py-1 text-xs text-info hover:bg-info-soft disabled:opacity-50"
              >
                Refused — no ID
              </button>
            </div>
          </div>
        )}

      {order.requiresAgeVerification && order.ageVerifiedAt && (
        <p className="mt-2 text-xs text-info">
          ID check recorded: {order.ageVerificationMethod?.replace(/_/g, " ")}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {order.status === "ASSIGNED" && !order.arrivedAtPickup && (
          <button
            disabled={busy}
            onClick={() => post("arrived")}
            className="rounded-lg border border-accent px-3 py-1.5 text-sm text-accent hover:bg-accent/10 disabled:opacity-50"
          >
            I&apos;m at the pickup
          </button>
        )}

        {order.status === "ASSIGNED" && (
          <button
            disabled={busy}
            onClick={() => post("picked-up")}
            className="rounded-lg bg-accent-solid px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
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
              className="rounded-lg bg-accent-solid px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Mark delivered"}
            </button>
          </>
        )}

        {order.status === "RETURNING" && (
          <button
            disabled={busy}
            onClick={() => post("returned")}
            className="rounded-lg bg-warn-solid px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
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
            className="rounded-lg border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger-soft disabled:opacity-50"
          >
            Can&apos;t deliver
          </button>
        )}
      </div>

      {order.status === "RETURNING" && (
        <p className="mt-2 rounded-lg bg-warn-soft p-2 text-xs text-warn">
          Return this parcel to {order.pickupAddress}
          {order.failureReason ? ` — reason logged: ${order.failureReason}` : ""}
        </p>
      )}

      {/* Two-way ratings: once the parcel is in hand, the courier can rate
          the pickup experience. */}
      {order.status !== "ASSIGNED" && order.merchantRating == null && (
        <MerchantRatingForm orderId={order.id} merchantName={order.merchantBusinessName ?? "this merchant"} />
      )}

      <div className="mt-3">
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="text-xs font-medium text-accent hover:underline"
        >
          {chatOpen ? "Hide messages" : "Message customer"}
        </button>
        {chatOpen && (
          <div className="mt-2">
            <OrderChat orderId={order.id} compact />
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
