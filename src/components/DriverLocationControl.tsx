"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Driver apni location har time on rakhega" — this is that: while the
 * courier is Online, it uses the browser's Geolocation API to watch their
 * position and pushes it to POST /api/couriers/me/location every ~5s. The
 * customer tracking page, the merchant's order view, and the admin live
 * map all read that feed. Lives in the driver layout so it keeps running
 * across every /driver/* page.
 */
export default function DriverLocationControl() {
  const [online, setOnline] = useState(false);
  const [status, setStatus] = useState<"idle" | "requesting" | "tracking" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSendRef = useRef<number>(0);

  useEffect(() => {
    // Restore toggle state from the server on mount.
    fetch("/api/couriers/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.courier?.isOnline) {
          setOnline(true);
          startWatching();
        }
      });
    return () => stopWatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startWatching() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setErrorMsg("This browser doesn't support location.");
      return;
    }
    setStatus("requesting");
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus("tracking");
        setErrorMsg(null);
        const nowMs = Date.now();
        // Throttle network sends to roughly once every 5 seconds even if
        // the browser reports positions more often.
        if (nowMs - lastSendRef.current < 5000) return;
        lastSendRef.current = nowMs;
        fetch("/api/couriers/me/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        })
          .then((r) => r.ok && setLastSentAt(new Date()))
          .catch(() => void 0);
      },
      (err) => {
        setStatus("error");
        setErrorMsg(err.message || "Location permission denied.");
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 }
    );
    watchIdRef.current = id;
  }

  function stopWatching() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus("idle");
  }

  async function toggleOnline() {
    const next = !online;
    setOnline(next);
    await fetch("/api/couriers/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: next }),
    });
    if (next) startWatching();
    else stopWatching();
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm">
      <button
        onClick={toggleOnline}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          online ? "bg-ok-soft text-ok" : "bg-surface-2 text-fg-muted"
        }`}
      >
        {online ? "● Online" : "○ Offline"}
      </button>
      {online && status === "tracking" && (
        <span className="text-xs text-fg-subtle">
          Sharing location{lastSentAt ? ` · updated ${lastSentAt.toLocaleTimeString()}` : "…"}
        </span>
      )}
      {online && status === "requesting" && (
        <span className="text-xs text-fg-subtle">Requesting location permission…</span>
      )}
      {status === "error" && <span className="text-xs text-danger">{errorMsg}</span>}
    </div>
  );
}
