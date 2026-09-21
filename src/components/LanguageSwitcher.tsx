"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/lib/i18n";

/**
 * Language picker for the customer tracking page. A simple two-button
 * toggle worked for English/French, but SwiftDrop now supports 18
 * languages (see src/lib/i18n.ts), so this is a dropdown instead — a row
 * of 18 buttons would never fit, and wrapping them would push the tracking
 * status down the page on a phone.
 *
 * Saved to the account when signed in, and to a cookie either way so a
 * customer on a tracking link keeps their choice even signed out.
 */
export default function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function change(locale: Locale) {
    setOpen(false);
    if (locale === current) return;
    setBusy(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative text-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-fg-muted hover:bg-surface-2 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
        </svg>
        {LOCALE_LABEL[current]}
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1 max-h-72 w-44 overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-lg"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={current === l}
              onClick={() => change(l)}
              className={`block w-full px-3 py-1.5 text-left text-[13px] ${
                current === l ? "bg-accent/10 font-medium text-accent" : "text-fg-muted hover:bg-surface-2"
              }`}
            >
              {LOCALE_LABEL[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
