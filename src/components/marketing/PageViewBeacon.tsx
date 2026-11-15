"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Counts one page view each time a public page is opened. Sets no cookie
 * and stores nothing in the browser; see src/lib/cms/analytics.ts for what
 * the server keeps.
 */
export default function PageViewBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    try {
      const body = JSON.stringify({ path: pathname, referrer: document.referrer || "" });
      if (!navigator.sendBeacon?.("/api/cms/hit", new Blob([body], { type: "text/plain" }))) {
        fetch("/api/cms/hit", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    } catch {
      // Never let counting break the page.
    }
  }, [pathname]);
  return null;
}
