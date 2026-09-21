"use client";

import { useState } from "react";

/**
 * Panic button — lives in the driver header so it's reachable from every
 * /driver/* page, not buried in a settings screen. Two taps on purpose (a
 * misclick shouldn't wake up every admin at 2am), but the second tap is
 * still a single click, not a typed confirmation — this has to be fast.
 */
export default function SOSButton() {
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send() {
    setState("sending");
    setConfirming(false);

    // Best-effort — an emergency shouldn't wait on a slow GPS fix. If it
    // doesn't resolve almost immediately, send without coordinates; the
    // server falls back to the courier's last known ping.
    const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!("geolocation" in navigator)) return resolve(null);
      const timer = setTimeout(() => resolve(null), 2500);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 2000 }
      );
    });

    const res = await fetch("/api/couriers/me/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coords ?? {}),
    });
    setState(res.ok ? "sent" : "error");
    if (res.ok) setTimeout(() => setState("idle"), 6000);
  }

  if (state === "sent") {
    return (
      <span className="rounded-full bg-ok-soft px-3 py-1.5 text-xs font-semibold text-ok">
        Admins notified
      </span>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={send}
          className="rounded-full bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          Confirm SOS
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-full border border-line px-2 py-1.5 text-xs text-fg-muted"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={state === "sending"}
      title="Alert admins immediately with your location"
      className="rounded-full border border-danger/30 bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-60"
    >
      {state === "sending" ? "Sending…" : state === "error" ? "Failed — tap to retry" : "🆘 SOS"}
    </button>
  );
}
