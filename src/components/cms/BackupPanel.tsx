"use client";

import { useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { adminFetch } from "./adminFetch";
import { dangerButton, primaryButton, quietButton, useToast } from "./Toast";

/** Download a backup file, or put website content back from one. */
export default function BackupPanel() {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function restore(file: File | undefined) {
    if (!file) return;
    if (!window.confirm(`Restore website content from “${file.name}”?\n\nALL current website content (published and drafts) will be replaced with what is in this file. Enquiries are not touched.\n\nDownload a fresh backup first if you are not sure.`)) {
      if (input.current) input.current.value = "";
      return;
    }
    setBusy(true);
    const res = await adminFetch<{ restored: string[] }>("/api/admin/cms/backup", { method: "POST", body: await file.text() });
    setBusy(false);
    if (input.current) input.current.value = "";
    if (!res.ok) return toast.show(res.error, "error");
    toast.show(`Restored ${res.data.restored.length} section${res.data.restored.length === 1 ? "" : "s"} from the backup.`);
  }

  return (
    <div className="space-y-4">
      <div className="card-shadow rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-[15px] font-semibold text-fg">Download a backup</h2>
        <p className="mt-1 text-[13.5px] text-fg-muted">
          One file with all website content and every enquiry. Keep it somewhere safe — it contains your customers’ contact details.
        </p>
        <a href="/api/admin/cms/backup" download className={`${primaryButton} mt-3 inline-block`}>
          Download backup file
        </a>
      </div>

      <div className="card-shadow rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-[15px] font-semibold text-fg">Restore from a backup</h2>
        <p className="mt-1 text-[13.5px] text-fg-muted">
          Puts the website content back to how it was in a backup file. Enquiries are never changed by a restore.
        </p>
        <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />
        <button type="button" disabled={busy} className={`${dangerButton} mt-3`} onClick={() => input.current?.click()}>
          {busy ? "Restoring…" : "Choose a backup file to restore"}
        </button>
      </div>
      {toast.node}
    </div>
  );
}

/** "Sign out everywhere" for the signed-in staff member (shown on the Website overview). */
export function SignOutEverywhere() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className={quietButton}
      onClick={async () => {
        if (!window.confirm("Sign out of every device, including this one?")) return;
        setBusy(true);
        const res = await adminFetch("/api/admin/cms/session", { method: "POST" });
        if (res.ok) signOut({ callbackUrl: "/login" });
        else setBusy(false);
      }}
    >
      {busy ? "Signing out…" : "Sign out everywhere"}
    </button>
  );
}
