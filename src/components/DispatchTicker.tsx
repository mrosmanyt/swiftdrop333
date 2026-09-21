"use client";

import { useEffect } from "react";

/**
 * Keeps the dispatch loop turning while anyone has the app open: expires
 * stale offers and pushes pending orders to the next courier. Mounted on
 * the driver offers page and the admin dashboard.
 *
 * In production, also run the same endpoint from a cron job so dispatch
 * continues when nobody is looking.
 */
export default function DispatchTicker({ intervalMs = 8000 }: { intervalMs?: number }) {
  useEffect(() => {
    function tick() {
      fetch("/api/dispatch", { method: "POST" }).catch(() => void 0);
    }
    tick();
    const t = setInterval(tick, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return null;
}
