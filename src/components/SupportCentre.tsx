"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Admin trust & support centre: the support inbox, the disputes/claims
 * queue, and open fraud flags, all in one place so ops has a single
 * screen for "things that need a human".
 */
export default function SupportCentre({
  tickets,
  counts,
  disputes,
  fraudFlags,
}: {
  tickets: any[];
  counts: any[];
  disputes: any[];
  fraudFlags: any[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"tickets" | "disputes" | "fraud">("tickets");
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const openCount = counts.find((c) => c.status === "open")?.count ?? 0;

  async function loadTicket(id: string) {
    setOpenTicket(id);
    const res = await fetch(`/api/support/tickets/${id}`);
    if (res.ok) setMessages((await res.json()).messages ?? []);
  }

  async function sendReply(internal: boolean) {
    if (!openTicket || !reply.trim()) return;
    setBusy(true);
    await fetch(`/api/admin/tickets/${openTicket}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply, internal }),
    });
    setBusy(false);
    setReply("");
    loadTicket(openTicket);
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    await fetch(`/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  }

  async function settleDispute(disputeId: string, status: "resolved" | "rejected") {
    const resolution = window.prompt(
      status === "resolved" ? "How was this resolved?" : "Why is this claim rejected?"
    );
    if (!resolution) return;
    let amount: number | undefined;
    if (status === "resolved") {
      const refund = window.prompt("Refund/credit amount in dollars (blank for none)", "");
      if (refund) amount = Math.round(Number(refund) * 100);
    }
    setBusy(true);
    await fetch("/api/admin/disputes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disputeId, status, resolution, resolutionAmountCents: amount }),
    });
    setBusy(false);
    router.refresh();
  }

  async function resolveFlag(flagId: string, status: "reviewed" | "dismissed") {
    setBusy(true);
    await fetch("/api/admin/fraud", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagId, status }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Trust & Support</h1>

      <div className="flex gap-2 border-b border-line">
        <Tab active={tab === "tickets"} onClick={() => setTab("tickets")}>
          Support inbox {openCount > 0 && <Badge>{openCount}</Badge>}
        </Tab>
        <Tab active={tab === "disputes"} onClick={() => setTab("disputes")}>
          Claims {disputes.filter((d) => d.status === "open").length > 0 && (
            <Badge>{disputes.filter((d) => d.status === "open").length}</Badge>
          )}
        </Tab>
        <Tab active={tab === "fraud"} onClick={() => setTab("fraud")}>
          Fraud flags {fraudFlags.length > 0 && <Badge>{fraudFlags.length}</Badge>}
        </Tab>
      </div>

      {tab === "tickets" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => loadTicket(t.id)}
                className={`block w-full rounded-xl border p-3 text-left ${
                  openTicket === t.id ? "border-accent bg-accent/10/20" : "border-line bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t.subject}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    t.status === "open" ? "bg-warn-soft text-warn" : "bg-surface-2 text-fg-muted"
                  }`}>
                    {t.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-fg-subtle">
                  {t.reference} · {t.opened_by_role} · {t.category} ·{" "}
                  {new Date(t.created_at).toLocaleString()}
                </p>
              </button>
            ))}
            {!tickets.length && <p className="text-sm text-fg-subtle">No tickets yet.</p>}
          </div>

          <div className="rounded-xl border border-line bg-surface p-4">
            {!openTicket && <p className="text-sm text-fg-subtle">Pick a ticket to read the thread.</p>}
            {openTicket && (
              <>
                <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-lg p-2 text-sm ${
                        m.internal
                          ? "border border-dashed border-line bg-bg-soft"
                          : m.sender_role === "admin"
                          ? "bg-accent/10/40"
                          : "bg-surface-2"
                      }`}
                    >
                      <p className="text-[11px] font-medium text-fg-muted">
                        {m.sender_role}
                        {m.internal ? " · internal note" : ""}
                      </p>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                </div>

                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  placeholder="Write a reply…"
                  className="w-full rounded-lg border border-line p-2 text-sm"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    disabled={busy}
                    onClick={() => sendReply(false)}
                    className="rounded-lg bg-accent-solid px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Reply & email
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => sendReply(true)}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm text-fg-muted hover:bg-bg-soft disabled:opacity-50"
                  >
                    Internal note
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setStatus(openTicket, "resolved")}
                    className="rounded-lg bg-ok-solid px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Mark resolved
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "disputes" && (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="text-fg-subtle">
              <tr>
                <th className="p-3">Raised by</th>
                <th className="p-3">Merchant</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Order value</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id} className="border-t border-line align-top">
                  <td className="p-3 text-xs">{d.raised_by}</td>
                  <td className="p-3 text-xs">{d.merchantName ?? "—"}</td>
                  <td className="p-3 text-xs">{d.customerName}</td>
                  <td className="p-3 max-w-xs text-xs">{d.reason}</td>
                  <td className="p-3 text-xs">
                    {d.order_amount_cents ? `$${(d.order_amount_cents / 100).toFixed(2)}` : "—"}
                  </td>
                  <td className="p-3 text-xs">
                    {d.status}
                    {d.resolution && <div className="text-fg-subtle">{d.resolution}</div>}
                    {d.resolution_amount_cents ? (
                      <div className="text-ok">
                        refunded ${(d.resolution_amount_cents / 100).toFixed(2)}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 text-right">
                    {d.status === "open" && (
                      <div className="flex justify-end gap-1">
                        <button
                          disabled={busy}
                          onClick={() => settleDispute(d.id, "resolved")}
                          className="rounded-lg bg-ok-solid px-2 py-1 text-xs text-white hover:opacity-90"
                        >
                          Resolve
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => settleDispute(d.id, "rejected")}
                          className="rounded-lg border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger-soft"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!disputes.length && (
                <tr>
                  <td className="p-3 text-fg-subtle" colSpan={7}>
                    No claims raised.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "fraud" && (
        <div className="space-y-2">
          {fraudFlags.map((f) => (
            <div key={f.id} className="rounded-xl border border-line bg-surface p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {f.rule.replace(/_/g, " ")}{" "}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                        f.severity === "high"
                          ? "bg-danger-soft text-danger"
                          : f.severity === "medium"
                          ? "bg-warn-soft text-warn"
                          : "bg-surface-2 text-fg-muted"
                      }`}
                    >
                      {f.severity}
                    </span>
                  </p>
                  <p className="text-xs text-fg-muted">{f.detail}</p>
                  <p className="mt-1 text-xs text-fg-subtle">
                    {f.courierEmail ?? f.subject_type} · {new Date(f.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    disabled={busy}
                    onClick={() => resolveFlag(f.id, "reviewed")}
                    className="rounded-lg bg-neutral-solid px-2 py-1 text-xs text-white hover:opacity-90"
                  >
                    Reviewed
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => resolveFlag(f.id, "dismissed")}
                    className="rounded-lg border border-line px-2 py-1 text-xs text-fg-muted hover:bg-bg-soft"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!fraudFlags.length && (
            <p className="text-sm text-fg-subtle">No open fraud flags — nothing suspicious right now.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm ${
        active ? "border-accent font-medium text-accent" : "border-transparent text-fg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 rounded-full bg-accent-solid px-1.5 py-0.5 text-[10px] text-white">{children}</span>
  );
}
