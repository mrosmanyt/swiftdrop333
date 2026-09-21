"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  docType: string;
  label: string;
  hint?: string;
  existing?: { id: string; status: string; originalName: string | null } | null;
}

export default function DocumentUpload({ docType, label, hint, existing }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("docType", docType);

    const res = await fetch("/api/upload/document", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Upload failed.");
      return;
    }
    setDone(true);
    router.refresh();
  }

  const uploaded = done || !!existing;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{label}</p>
          {hint && <p className="text-xs text-gray-400">{hint}</p>}
          {existing && (
            <p className="mt-1 text-xs text-gray-500">
              {existing.originalName} ·{" "}
              <span
                className={
                  existing.status === "accepted"
                    ? "text-green-600"
                    : existing.status === "rejected"
                    ? "text-red-600"
                    : "text-yellow-600"
                }
              >
                {existing.status}
              </span>
            </p>
          )}
        </div>
        <span className={`text-xl ${uploaded ? "text-green-500" : "text-gray-300"}`}>
          {uploaded ? "✓" : "○"}
        </span>
      </div>

      <input
        type="file"
        accept="image/*,application/pdf"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
        className="mt-3 text-xs"
      />
      {busy && <p className="mt-1 text-xs text-gray-400">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
