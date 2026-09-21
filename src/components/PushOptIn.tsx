"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type State = "checking" | "unsupported" | "off" | "on" | "denied" | "busy";

/**
 * "Turn on notifications" toggle — reused on the driver portal (new offer
 * alerts) and the guest tracking page (order status alerts). Two different
 * subjects on the same component: a signed-in driver is subscribed against
 * their account server-side (no orderId needed here), a tracking-page
 * customer is subscribed against that one order (orderId required).
 */
export default function PushOptIn({ orderId, label }: { orderId?: string; label: string }) {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) return;
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), orderId }),
      });
      setState("on");
    } catch {
      setState("off");
    }
  }

  if (state === "checking" || state === "unsupported") return null;

  if (state === "on") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-fg-subtle">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ok" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Notifications on
      </span>
    );
  }

  if (state === "denied") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-fg-subtle">
        Notifications blocked — enable in browser settings
      </span>
    );
  }

  return (
    <button
      onClick={enable}
      disabled={state === "busy"}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-2 disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {label}
    </button>
  );
}
