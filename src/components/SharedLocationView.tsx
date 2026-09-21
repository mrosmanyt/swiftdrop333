"use client";

import { useEffect, useState } from "react";
import LiveMap, { MapMarker } from "./LiveMap";

interface ShareData {
  firstName: string;
  vehicleType: string;
  lat: number | null;
  lng: number | null;
  lastLocationAt: string | null;
  expiresAt: string;
}

/** Polls the public share endpoint every 5s — same live-without-a-socket pattern as the customer tracking page and the admin ops map. */
export default function SharedLocationView({ token }: { token: string }) {
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await fetch(`/api/safety/share/${token}`, { cache: "no-store" });
      if (cancelled) return;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "This link isn't available anymore.");
        return;
      }
      setData(await res.json());
    }
    poll();
    const t = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [token]);

  if (error) {
    return <p className="rounded-xl border border-line bg-surface p-4 text-sm text-fg-muted">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-fg-muted">Loading…</p>;
  }

  const markers: MapMarker[] =
    data.lat != null && data.lng != null
      ? [{ id: "courier", lat: data.lat, lng: data.lng, label: `${data.firstName} · ${data.vehicleType.toLowerCase()}`, kind: "courier" }]
      : [];

  return (
    <div className="space-y-3">
      {markers.length ? (
        <LiveMap markers={markers} height={360} />
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-line text-sm text-fg-subtle">
          No location yet — {data.firstName} hasn't shared their position.
        </div>
      )}
      <div className="rounded-xl border border-line bg-surface p-3 text-sm">
        <p className="font-medium text-fg">{data.firstName}</p>
        <p className="mt-0.5 text-xs text-fg-subtle">
          {data.lastLocationAt ? `Last updated ${new Date(data.lastLocationAt).toLocaleTimeString()}` : "No signal yet"}
          {" · "}
          Link expires {new Date(data.expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
