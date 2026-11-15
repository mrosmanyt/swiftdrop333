"use client";

import { useState } from "react";

const field = "mt-1.5 block w-full rounded-xl border border-line px-3.5 py-2.5 text-[15px] text-fg";
const label = "block text-[13.5px] font-medium text-fg";

/** The public contact form. Sends to POST /api/enquiries. */
export default function ContactForm({
  types,
  buttonLabel,
  successTitle,
  successText,
}: {
  types: string[];
  buttonLabel: string;
  successTitle: string;
  successText: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(
      ["type", "name", "company", "email", "phone", "city", "message", "website"].map((k) => [k, String(form.get(k) ?? "")])
    );
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, sourcePath: window.location.pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(typeof data?.error === "string" ? data.error : "Something went wrong. Please try again.");
      else setSent(true);
    } catch {
      setError("No connection. Please check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="py-10 text-center" role="status">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ok-soft text-ok">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h2 className="mt-4 text-[20px] font-semibold tracking-tight text-fg">{successTitle}</h2>
        <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-fg-muted">{successText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate={false}>
      <label className={`${label} sm:col-span-2`}>
        What is this about?
        <select name="type" className={field} defaultValue={types[0]}>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        Your name
        <input name="name" required minLength={2} maxLength={120} autoComplete="name" className={field} />
      </label>
      <label className={label}>
        Business name <span className="font-normal text-fg-subtle">(optional)</span>
        <input name="company" maxLength={160} autoComplete="organization" className={field} />
      </label>
      <label className={label}>
        Email
        <input name="email" type="email" maxLength={200} autoComplete="email" className={field} />
      </label>
      <label className={label}>
        Phone
        <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={field} />
      </label>
      <p className="-mt-2 text-[12.5px] text-fg-subtle sm:col-span-2">Give us an email address or a phone number — whichever you prefer we reply on.</p>
      <label className={`${label} sm:col-span-2`}>
        City <span className="font-normal text-fg-subtle">(optional)</span>
        <input name="city" maxLength={80} autoComplete="address-level2" className={field} />
      </label>
      <label className={`${label} sm:col-span-2`}>
        Message
        <textarea name="message" required minLength={5} maxLength={3000} rows={5} className={field} />
      </label>

      {/* Honeypot: hidden from people and screen readers; bots fill it in and are ignored. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13.5px] text-danger sm:col-span-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-inverse px-5 py-3 text-[14.5px] font-medium text-inverse-fg transition-transform hover:scale-[1.01] disabled:opacity-60 sm:col-span-2"
      >
        {busy ? "Sending…" : buttonLabel}
      </button>
    </form>
  );
}
