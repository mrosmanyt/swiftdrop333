"use client";

import { useState } from "react";

export default function SafetySettings({ initialName, initialPhone }: { initialName: string; initialPhone: string }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [savedState, setSavedState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function saveContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavedState("saving");
    const res = await fetch("/api/couriers/me/safety", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    setSavedState(res.ok ? "saved" : "error");
    if (res.ok) setTimeout(() => setSavedState("idle"), 2500);
  }

  async function generateShareLink() {
    setShareBusy(true);
    const res = await fetch("/api/couriers/me/location-share", { method: "POST" });
    setShareBusy(false);
    if (!res.ok) return;
    const data = await res.json();
    setShareLink(`${window.location.origin}/safety/share/${data.token}`);
    setShareExpiresAt(data.expiresAt);
    setCopied(false);
  }

  async function copyLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail silently — the link text is still on the
      // page, so there's always a fallback (select + copy manually).
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">Emergency contact</h2>
        <p className="mt-1 text-xs text-fg-muted">Who should we reach out to if something goes wrong.</p>
        <form onSubmit={saveContact} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg outline-none transition focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg outline-none transition focus:border-accent"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={savedState === "saving"}
              className="rounded-lg bg-inverse px-4 py-2 text-sm font-medium text-inverse-fg hover:opacity-90 disabled:opacity-50"
            >
              {savedState === "saving" ? "Saving…" : "Save"}
            </button>
            {savedState === "saved" && <span className="ml-3 text-sm text-ok">Saved.</span>}
            {savedState === "error" && <span className="ml-3 text-sm text-danger">Couldn't save — try again.</span>}
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">Share your live location</h2>
        <p className="mt-1 text-xs text-fg-muted">
          Generate a link and text it to your emergency contact — they can watch your position for the
          next hour, no account needed on their end.
        </p>
        <button
          onClick={generateShareLink}
          disabled={shareBusy}
          className="mt-3 rounded-lg bg-accent-solid px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {shareBusy ? "Generating…" : "Generate share link"}
        </button>
        {shareLink && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-fg">
              {shareLink}
            </code>
            <button
              onClick={copyLink}
              className="rounded-lg bg-inverse px-4 py-2 text-[13px] font-medium text-inverse-fg transition hover:opacity-90"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        )}
        {shareExpiresAt && (
          <p className="mt-1.5 text-[11px] text-fg-subtle">
            Expires {new Date(shareExpiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}
