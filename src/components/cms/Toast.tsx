"use client";

import { useCallback, useEffect, useState } from "react";

type ToastState = { text: string; tone: "ok" | "error"; id: number } | null;

/** Small message that slides in at the bottom of the screen after save / publish / delete. */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.tone === "error" ? 6000 : 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const show = useCallback((text: string, tone: "ok" | "error" = "ok") => setToast({ text, tone, id: Date.now() }), []);

  const node = toast ? (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-4 bottom-24 z-[70] mx-auto w-fit max-w-[92vw] rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg md:bottom-6 ${
        toast.tone === "error" ? "bg-danger-solid" : "bg-ok-solid"
      }`}
    >
      {toast.text}
    </div>
  ) : null;

  return { show, node };
}

export const inputClass =
  "mt-1 block w-full rounded-lg border border-line px-3 py-2 text-[14px] text-fg disabled:opacity-60";
export const primaryButton =
  "rounded-lg bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50";
export const quietButton =
  "rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-50";
export const dangerButton =
  "rounded-lg border border-danger/30 px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft disabled:opacity-50";
