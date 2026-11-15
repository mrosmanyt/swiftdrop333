"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

/**
 * Account & privacy settings shared by every portal: change password, and
 * (for non-admins) delete the account.
 */
export default function AccountSettings({
  role,
  email,
  eraseAfterDays,
}: {
  role: "MERCHANT" | "COURIER" | "ADMIN" | "CUSTOMER";
  email: string;
  eraseAfterDays: number;
}) {
  const [pwState, setPwState] = useState<{ busy: boolean; msg: string | null; ok: boolean }>({ busy: false, msg: null, ok: false });
  const [delState, setDelState] = useState<{ open: boolean; busy: boolean; msg: string | null }>({ open: false, busy: false, msg: null });

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setPwState({ busy: false, ok: false, msg: "The two new passwords don't match." });
      return;
    }
    setPwState({ busy: true, ok: false, msg: null });
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.get("currentPassword"), newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      setPwState({ busy: false, ok: true, msg: "Password updated — please sign in again." });
      // Every session (including this one) is signed out after a password change.
      setTimeout(() => signOut({ callbackUrl: "/login" }), 1200);
    } else {
      setPwState({ busy: false, ok: false, msg: data.error ?? "Couldn't update the password." });
    }
  }

  async function deleteAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setDelState((s) => ({ ...s, busy: true, msg: null }));
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.get("password") }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDelState((s) => ({ ...s, busy: false, msg: data.error ?? "Couldn't delete the account." }));
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  const input =
    "mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg outline-none transition focus:border-accent";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account & privacy</h1>
        <p className="mt-1 text-sm text-fg-muted">Signed in as {email}</p>
      </div>

      <form onSubmit={changePassword} className="space-y-3 rounded-xl border border-line bg-surface p-4">
        <h2 className="font-semibold">Change password</h2>
        <label className="block text-sm">
          Current password
          <input name="currentPassword" type="password" required autoComplete="current-password" className={input} />
        </label>
        <label className="block text-sm">
          New password
          <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className={input} />
        </label>
        <label className="block text-sm">
          Repeat new password
          <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className={input} />
        </label>
        <p className="text-xs text-fg-subtle">At least 8 characters, with an uppercase letter, a lowercase letter and a digit.</p>
        <div className="flex items-center gap-3">
          <button
            disabled={pwState.busy}
            className="rounded-lg bg-inverse px-4 py-2 text-sm font-medium text-inverse-fg hover:opacity-90 disabled:opacity-50"
          >
            {pwState.busy ? "Saving…" : "Update password"}
          </button>
          {pwState.msg && <span className={`text-sm ${pwState.ok ? "text-ok" : "text-danger"}`}>{pwState.msg}</span>}
        </div>
      </form>

      <div className="rounded-xl border border-line bg-surface p-4 text-sm">
        <h2 className="font-semibold">Your data</h2>
        <p className="mt-1 text-fg-muted">
          We never store card numbers or bank account details. Identity documents are encrypted and deleted
          shortly after review, and delivery contact details are removed automatically after a year.{" "}
          <a href="/privacy" className="text-accent hover:underline">
            Privacy policy
          </a>
        </p>
      </div>

      {role !== "ADMIN" && (
        <div className="rounded-xl border border-danger/30 bg-surface p-4">
          <h2 className="font-semibold text-danger">Delete account</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {role === "CUSTOMER"
              ? "Your name, email, phone number, saved addresses and order history links are erased immediately. This can't be undone."
              : `You'll be signed out and unable to sign in. Your personal details and documents are permanently erased after ${eraseAfterDays} days (so any pending payout or open claim can be settled first). Delivery totals are kept without your personal details, as required for accounting.`}
          </p>
          {!delState.open ? (
            <button
              onClick={() => setDelState((s) => ({ ...s, open: true }))}
              className="mt-3 rounded-lg border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger-soft"
            >
              Delete my account
            </button>
          ) : (
            <form onSubmit={deleteAccount} className="mt-3 space-y-2">
              <label className="block text-sm">
                Confirm with your password
                <input name="password" type="password" required autoComplete="current-password" className={input} />
              </label>
              <div className="flex items-center gap-2">
                <button
                  disabled={delState.busy}
                  className="rounded-lg bg-danger-solid px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {delState.busy ? "Deleting…" : "Permanently delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setDelState({ open: false, busy: false, msg: null })}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm text-fg-muted hover:bg-fg/5"
                >
                  Cancel
                </button>
              </div>
              {delState.msg && <p className="text-sm text-danger">{delState.msg}</p>}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
