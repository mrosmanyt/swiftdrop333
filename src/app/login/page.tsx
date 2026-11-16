"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import AuthShell from "@/components/AuthShell";

/**
 * Single sign-in page shared by all 3 internal roles — the credentials
 * provider checks the user's role and the middleware routes them.
 */
export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Arriving from a sign-up where the account was created but the automatic
  // sign-in didn't go through.
  const [justCreated, setJustCreated] = useState(false);
  useEffect(() => {
    setJustCreated(new URLSearchParams(window.location.search).get("created") === "1");
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    }).catch(() => null);

    if (!res) {
      setBusy(false);
      setError("Couldn't reach the server. Check your connection and try again.");
      return;
    }
    if (res.error) {
      setBusy(false);
      // "CredentialsSignin" is NextAuth's generic wrong-email-or-password
      // code; anything else is a message we threw on purpose (rate limit,
      // suspended account, temporary outage) and is safe to show as-is.
      setError(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error);
      return;
    }

    // Each role has its own home screen — a customer landing on the
    // marketing page after signing in would just look broken.
    const session = await fetch("/api/auth/session").then((r) => r.json()).catch(() => null);
    const role = session?.user?.role;
    const dest =
      role === "MERCHANT" ? "/merchant/dashboard" :
      role === "COURIER" ? "/driver/offers" :
      role === "ADMIN" ? "/admin" :
      role === "CUSTOMER" ? "/customer" : "/";
    window.location.href = dest;
  }

  return (
    <AuthShell
      photo="authLogin"
      title="Welcome back"
      subtitle="Sign in to your merchant or courier account."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {justCreated && (
        <p className="mb-3 rounded-lg border border-line bg-bg p-2.5 text-sm text-fg-muted">
          Your account was created. Sign in to continue.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm text-fg-muted">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg outline-none transition focus:border-accent"
          />
        </label>
        <label className="block text-sm text-fg-muted">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg outline-none transition focus:border-accent"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-inverse py-2.5 font-medium text-inverse-fg transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>

      {/* Demo credentials are a development convenience only — they are
          never rendered in a production build. */}
      {process.env.NODE_ENV !== "production" && (
        <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-fg-subtle">
          Dev accounts — merchant@example.com · courier@example.com
          (password: password123)
        </p>
      )}
    </AuthShell>
  );
}
