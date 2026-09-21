"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthShell from "@/components/AuthShell";

function CustomerSignupForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const res = await fetch("/api/signup/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        fullName: form.get("fullName"),
        phone: form.get("phone") || undefined,
        referralCode: (form.get("referralCode") as string) || undefined,
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

    await signIn("credentials", { email, password, redirect: false });
    window.location.href = "/customer";
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track every delivery sent to you, save addresses, and earn loyalty points."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
          <br />
          Running a business or delivering instead?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            See other options
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field name="fullName" label="Full name" />
        <Field name="email" label="Email" type="email" />
        <Field name="password" label="Password (min 8 characters)" type="password" />
        <Field name="phone" label="Mobile number" required={false} />
        <Field name="referralCode" label="Referral code (optional)" required={false} defaultValue={refCode} />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-inverse py-2 font-medium text-inverse-fg hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </AuthShell>
  );
}

export default function CustomerSignupPage() {
  return (
    <Suspense fallback={null}>
      <CustomerSignupForm />
    </Suspense>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg outline-none transition focus:border-accent"
      />
    </label>
  );
}
