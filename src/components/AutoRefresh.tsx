"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Invisible helper — re-fetches server-component data on an interval so
 * dashboards feel live without a full WebSocket layer. */
export default function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
