"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** English / French switch. Saved to the account when signed in, and to a
 *  cookie either way so a customer on a tracking link keeps their choice. */
export default function LanguageSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(locale: string) {
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
    <div className="flex gap-1 text-xs">
      {[
        { id: "en", label: "EN" },
        { id: "fr", label: "FR" },
      ].map((l) => (
        <button
          key={l.id}
          disabled={busy}
          onClick={() => change(l.id)}
          className={`rounded px-2 py-1 ${
            current === l.id ? "bg-accent-solid text-white" : "text-fg-muted hover:bg-surface-2"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
