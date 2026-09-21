"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import AuthShell from "@/components/AuthShell";

export default function MerchantSignupPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const res = await fetch("/api/signup/merchant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        businessName: form.get("businessName"),
        contactName: form.get("contactName"),
        businessPhone: form.get("businessPhone"),
        businessAddress: form.get("businessAddress"),
        businessNumber: form.get("businessNumber") || undefined,
        website: form.get("website") || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setBusy(false);
      setError(
        typeof data.error === "string"
          ? data.error
          : "Check the form — password must be at least 8 characters."
      );
      return;
    }

    // Sign them straight in so they land on their status page.
    await signIn("credentials", { email, password, redirect: false });
    window.location.href = "/merchant/dashboard";
  }

  return (
    <AuthShell
      title="Business sign-up"
      subtitle="We verify every business before the first delivery. It usually takes less than a working day."
      width="lg"
      footer={<>
          Want to deliver instead?{" "}
          <Link href="/signup/courier" className="text-accent hover:underline">
            Apply as a courier
          </Link>
        </>}
    >

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field name="businessName" label="Business name" />
        <Field name="contactName" label="Your name" />
        <Field name="email" label="Work email" type="email" />
        <Field name="password" label="Password (min 8 characters)" type="password" />
        <Field name="businessPhone" label="Business phone" />
        <Field name="businessAddress" label="Pickup address" />
        <Field name="businessNumber" label="CRA business number (optional)" required={false} />
        <Field name="website" label="Website (optional)" required={false} />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-inverse py-2 font-medium text-inverse-fg hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Creating account…" : "Create business account"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </AuthShell>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg outline-none transition focus:border-accent"
      />
    </label>
  );
}
