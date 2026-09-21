"use client";

import { signIn, getSession } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // Fetch updated session to check user role and redirect to correct portal
      const session = await getSession();
      const role = (session?.user as any)?.role;

      if (role === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else if (role === "MERCHANT") {
        window.location.href = "/merchant/dashboard";
      } else if (role === "COURIER") {
        window.location.href = "/driver/offers";
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-2xl font-bold text-brand">Sign in to SwiftDrop</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
          <input
            name="email"
            type="email"
            placeholder="Email"
            defaultValue="cenemtech@gmail.com"
            required
            className="w-full rounded-lg border border-gray-300 p-2 text-black text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
          <input
            name="password"
            type="password"
            placeholder="Password"
            defaultValue="Malik786@"
            required
            className="w-full rounded-lg border border-gray-300 p-2 text-black text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand py-2.5 font-medium text-white hover:bg-brand-dark transition disabled:opacity-50 mt-2"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        {error && <p className="text-sm font-medium text-red-600 mt-2">{error}</p>}
      </form>

      <div className="mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 border border-gray-200">
        <p className="font-semibold text-gray-800 mb-1">Admin Account Details:</p>
        <p>Email: <code className="text-brand font-mono font-semibold">cenemtech@gmail.com</code></p>
        <p>Password: <code className="text-brand font-mono font-semibold">Malik786@</code></p>
      </div>
    </main>
  );
}
