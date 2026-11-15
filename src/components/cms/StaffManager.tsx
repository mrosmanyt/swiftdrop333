"use client";

import { useState } from "react";
import { STAFF_ROLES, staffRoleLabel, type StaffRole } from "@/lib/cms/permissions";
import type { StaffMember } from "@/lib/cms/staffRepo";
import { adminFetch } from "./adminFetch";
import { dangerButton, inputClass, primaryButton, quietButton, useToast } from "./Toast";

/** Add staff, choose what each person can do, and switch access off when someone leaves. */
export default function StaffManager({ initial, me, myRole }: { initial: StaffMember[]; me: string; myRole: StaffRole }) {
  const [staff, setStaff] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  // Only an owner may hand out the owner role.
  const roles = STAFF_ROLES.filter((r) => r.value !== "owner" || myRole === "owner");

  async function patch(id: string, body: Record<string, unknown>, done: string) {
    setBusy(true);
    const res = await adminFetch<{ staff: StaffMember[] }>(`/api/admin/cms/staff/${id}`, { method: "PATCH", json: body });
    setBusy(false);
    if (!res.ok) return toast.show(res.error, "error");
    setStaff(res.data.staff);
    toast.show(done);
  }

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const res = await adminFetch<{ staff: StaffMember[] }>("/api/admin/cms/staff", {
      method: "POST",
      json: {
        fullName: form.get("fullName"),
        email: form.get("email"),
        password: form.get("password"),
        staffRole: form.get("staffRole"),
      },
    });
    setBusy(false);
    if (!res.ok) return toast.show(res.error, "error");
    setStaff(res.data.staff);
    setAdding(false);
    toast.show("Staff member added. Give them their email and password to sign in.");
  }

  return (
    <div className="space-y-4">
      <div className="card-shadow rounded-2xl border border-line bg-surface p-4">
        {!adding ? (
          <button type="button" className={primaryButton} onClick={() => setAdding(true)}>
            + Add staff member
          </button>
        ) : (
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] font-medium text-fg">
              Full name
              <input name="fullName" required maxLength={120} className={inputClass} />
            </label>
            <label className="text-[13px] font-medium text-fg">
              Email address
              <input name="email" type="email" required maxLength={200} className={inputClass} autoComplete="off" />
            </label>
            <label className="text-[13px] font-medium text-fg">
              Starting password
              <input name="password" type="text" required minLength={8} maxLength={200} className={inputClass} autoComplete="off" />
              <span className="mt-1 block text-[12px] font-normal text-fg-subtle">
                At least 8 characters with a capital letter, a small letter and a number. Ask them to change it after their first sign-in (Account &amp; privacy).
              </span>
            </label>
            <label className="text-[13px] font-medium text-fg">
              Role
              <select name="staffRole" defaultValue="editor" className={inputClass}>
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={busy} className={primaryButton}>
                {busy ? "Adding…" : "Add staff member"}
              </button>
              <button type="button" className={quietButton} onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card-shadow overflow-hidden rounded-2xl border border-line bg-surface">
        <ul className="divide-y divide-line">
          {staff.map((s) => {
            const isMe = s.id === me;
            // Administrators can't change owners.
            const locked = isMe || (s.staffRole === "owner" && myRole !== "owner");
            const off = s.status !== "active";
            return (
              <li key={s.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${off ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-medium text-fg">
                    {s.fullName || s.email}
                    {isMe && <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">you</span>}
                    {off && <span className="ml-2 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">access off</span>}
                  </p>
                  <p className="truncate text-[13px] text-fg-subtle">{s.email}</p>
                </div>
                {locked ? (
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] text-fg-muted">{staffRoleLabel(s.staffRole)}</span>
                ) : (
                  <select
                    aria-label={`Role for ${s.email}`}
                    className="rounded-lg border border-line px-2 py-1.5 text-[13px]"
                    value={s.staffRole}
                    disabled={busy}
                    onChange={(e) => {
                      const role = e.target.value as StaffRole;
                      if (window.confirm(`Change ${s.email} to ${staffRoleLabel(role)}?\n\nThey will be signed out and need to sign in again.`)) {
                        patch(s.id, { staffRole: role }, "Role changed.");
                      }
                    }}
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                )}
                {!locked && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={quietButton}
                      disabled={busy}
                      onClick={() => {
                        const pw = window.prompt(`New password for ${s.email}\n(8+ characters, with a capital letter, a small letter and a number)`);
                        if (pw) patch(s.id, { password: pw }, "Password changed. They are signed out everywhere.");
                      }}
                    >
                      Reset password
                    </button>
                    <button type="button" className={quietButton} disabled={busy} onClick={() => patch(s.id, { signOut: true }, "Signed out of every device.")}>
                      Sign out everywhere
                    </button>
                    {off ? (
                      <button type="button" className={quietButton} disabled={busy} onClick={() => patch(s.id, { status: "active" }, "Access turned back on.")}>
                        Turn access on
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={dangerButton}
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`Turn off access for ${s.email}?\n\nThey are signed out straight away and cannot sign in until you turn it back on.`)) {
                            patch(s.id, { status: "suspended" }, "Access turned off.");
                          }
                        }}
                      >
                        Turn access off
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card-shadow rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-[15px] font-semibold text-fg">What each role can do</h2>
        <ul className="mt-3 space-y-2">
          {STAFF_ROLES.map((r) => (
            <li key={r.value} className="text-[13.5px] text-fg-muted">
              <span className="font-medium text-fg">{r.label}</span> — {r.about}
            </li>
          ))}
        </ul>
      </div>
      {toast.node}
    </div>
  );
}
