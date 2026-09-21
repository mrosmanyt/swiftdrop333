"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  orderId: string;
  offerId?: string;
  expiresAt?: string;
  zoneName: string;
  pickupAddress: string;
  dropoffAddress: string;
  serviceType: string;
  courierFeeCents: number;
  distanceKm?: number | null;
  windowEnd?: string | null;
  broadcast?: boolean;
}

/**
 * A live delivery offer. A targeted offer shows a countdown — when it runs
 * out the order moves on to the next courier automatically, so the timer
 * is real, not decoration. Broadcast offers (already passed over by
 * everyone nearby) have no timer and anyone can take them.
 */
export default function OfferCard({
  orderId,
  offerId,
  expiresAt,
  zoneName,
  pickupAddress,
  dropoffAddress,
  serviceType,
  courierFeeCents,
  distanceKm,
  windowEnd,
  broadcast,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    function tick() {
      const ms = new Date(expiresAt!).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.round(ms / 1000)));
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  async function accept() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/accept`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not accept.");
    }
    router.refresh();
  }

  async function decline() {
    if (!offerId) return;
    setBusy(true);
    await fetch(`/api/offers/${offerId}/decline`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  const urgent = secondsLeft !== null && secondsLeft <= 15;

  return (
    <div
      className={`rounded-xl border bg-white p-4 ${
        broadcast ? "border-gray-200" : urgent ? "border-red-300" : "border-brand"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{zoneName}</p>
            {broadcast ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">open to all</span>
            ) : (
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand-dark">
                offered to you
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {pickupAddress} → {dropoffAddress}
          </p>
          <p className="text-xs text-gray-400">
            {serviceType}
            {distanceKm ? ` · ${distanceKm.toFixed(1)} km` : ""}
            {windowEnd ? ` · by ${new Date(windowEnd).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold text-brand">${(courierFeeCents / 100).toFixed(2)}</p>
          {secondsLeft !== null && !broadcast && (
            <p className={`text-xs font-medium ${urgent ? "text-red-500" : "text-gray-400"}`}>
              {secondsLeft}s left
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={accept}
          disabled={busy}
          className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "…" : "Accept"}
        </button>
        {offerId && !broadcast && (
          <button
            onClick={decline}
            disabled={busy}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            Pass
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
