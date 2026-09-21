"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Doc {
  id: string;
  docType: string;
  originalName: string | null;
  status: string;
}

interface Props {
  kind: "merchant" | "courier";
  id: string;
  title: string;
  subtitle: string;
  details: { label: string; value: string }[];
  documents: Doc[];
}

/** One application card in the admin approval queue, with the actual
 * approve/reject actions wired to the admin API. */
export default function ApplicationReview({ kind, id, title, subtitle, details, documents }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approve" | "reject") {
    setBusy(true);
    setError(null);
    const body =
      kind === "merchant"
        ? { kybStatus: decision === "approve" ? "verified" : "rejected", notes: notes || undefined }
        : { approvalStatus: decision === "approve" ? "approved" : "rejected", notes: notes || undefined };

    const res = await fetch(`/api/admin/${kind === "merchant" ? "merchants" : "couriers"}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Action failed — try again.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-fg-muted">{subtitle}</p>
        </div>
        <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs text-warn">pending</span>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {details.map((d) => (
          <div key={d.label} className="flex justify-between border-b border-line/60 py-1">
            <dt className="text-fg-subtle">{d.label}</dt>
            <dd className="text-fg-muted">{d.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3">
        <p className="text-xs font-medium text-fg-muted">Documents</p>
        {documents.length ? (
          <ul className="mt-1 space-y-1 text-sm">
            {documents.map((d) => (
              <li key={d.id}>
                <a
                  href={`/api/admin/documents/${d.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  {d.docType.replace(/_/g, " ")} — {d.originalName ?? "view"}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-fg-subtle">No documents uploaded yet.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note (shown to the applicant)"
          className="flex-1 rounded-lg border border-line p-2 text-sm"
        />
        <button
          disabled={busy}
          onClick={() => decide("approve")}
          className="rounded-lg bg-ok-solid px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={busy}
          onClick={() => decide("reject")}
          className="rounded-lg border border-danger/30 px-3 py-2 text-sm text-danger hover:bg-danger-soft disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
