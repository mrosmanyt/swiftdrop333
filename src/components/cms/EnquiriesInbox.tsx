"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ENQUIRY_STATUSES, enquiryStatusLabel, type Enquiry } from "@/lib/cms/enquiryStatus";
import { adminFetch } from "./adminFetch";
import { dangerButton, inputClass, primaryButton, quietButton, useToast } from "./Toast";

/**
 * The enquiries inbox: every message sent from the website's contact form.
 * Search and filter at the top, tap a row to open it, then change its
 * status, add a note, set a follow-up date or hand it to a colleague.
 */

interface StaffOption {
  id: string;
  email: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const digits = (v: string) => v.replace(/[^\d]/g, "");

export default function EnquiriesInbox({
  initial,
  types,
  staff,
  canEdit,
  canDelete,
  canExport,
}: {
  initial: Enquiry[];
  types: string[];
  staff: StaffOption[];
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [filters, setFilters] = useState({ q: "", status: "", type: "", from: "", to: "" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const query = useMemo(() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
    return p.toString();
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch<{ enquiries: Enquiry[] }>(`/api/admin/cms/enquiries?${query}`);
    setLoading(false);
    if (res.ok) setItems(res.data.enquiries);
    else toast.show(res.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Re-load a moment after the filters stop changing.
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const open = items.find((e) => e.id === openId) ?? null;

  async function patch(id: string, body: Record<string, unknown>, done: string) {
    const res = await adminFetch<{ enquiry: Enquiry }>(`/api/admin/cms/enquiries/${id}`, { method: "PATCH", json: body });
    if (!res.ok) return toast.show(res.error, "error"), false;
    setItems((list) => list.map((e) => (e.id === id ? res.data.enquiry : e)));
    toast.show(done);
    return true;
  }

  async function remove(e: Enquiry) {
    if (!window.confirm(`Delete the enquiry from ${e.name}?\n\nThis permanently removes it and its notes. It cannot be undone.`)) return;
    const res = await adminFetch(`/api/admin/cms/enquiries/${e.id}`, { method: "DELETE" });
    if (!res.ok) return toast.show(res.error, "error");
    setItems((list) => list.filter((x) => x.id !== e.id));
    setOpenId(null);
    toast.show("Enquiry deleted.");
  }

  const setFilter = (k: keyof typeof filters, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card-shadow grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="text-[12.5px] text-fg-muted lg:col-span-2">
          Search
          <input className={inputClass} placeholder="Name, email, phone, business…" value={filters.q} onChange={(e) => setFilter("q", e.target.value)} />
        </label>
        <label className="text-[12.5px] text-fg-muted">
          Status
          <select className={inputClass} value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
            <option value="">All</option>
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[12.5px] text-fg-muted">
          Type
          <select className={inputClass} value={filters.type} onChange={(e) => setFilter("type", e.target.value)}>
            <option value="">All</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[12.5px] text-fg-muted">
          From
          <input type="date" className={inputClass} value={filters.from} onChange={(e) => setFilter("from", e.target.value)} />
        </label>
        <label className="text-[12.5px] text-fg-muted">
          To
          <input type="date" className={inputClass} value={filters.to} onChange={(e) => setFilter("to", e.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-6">
          <span className="mr-auto text-[13px] text-fg-subtle">
            {loading ? "Loading…" : `${items.length} ${items.length === 1 ? "enquiry" : "enquiries"}`}
          </span>
          {Object.values(filters).some(Boolean) && (
            <button type="button" className={quietButton} onClick={() => setFilters({ q: "", status: "", type: "", from: "", to: "" })}>
              Clear filters
            </button>
          )}
          {canExport && (
            <a className={quietButton} href={`/api/admin/cms/enquiries/export?${query}`} download>
              Download for Excel
            </a>
          )}
        </div>
      </div>

      {/* List */}
      <div className="card-shadow overflow-hidden rounded-2xl border border-line bg-surface">
        {!items.length && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-fg">No enquiries here</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-fg-subtle">
              Messages sent from the website’s contact page appear here. Try clearing the filters.
            </p>
          </div>
        )}
        <ul className="divide-y divide-line">
          {items.map((e) => {
            const s = ENQUIRY_STATUSES.find((x) => x.value === e.status)!;
            const overdue = e.followUpOn && e.followUpOn <= today() && e.status !== "won" && e.status !== "lost";
            return (
              <li key={e.id}>
                <button type="button" onClick={() => setOpenId(e.id)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-fg/[0.03]">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-medium text-fg">
                      {e.name}
                      {e.company && <span className="font-normal text-fg-muted"> · {e.company}</span>}
                    </span>
                    <span className="block truncate text-[13px] text-fg-subtle">{e.message}</span>
                  </span>
                  {overdue && <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11.5px] font-medium text-danger">Follow up {e.followUpOn === today() ? "today" : "overdue"}</span>}
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] text-fg-muted">{e.type}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${s.tone}`}>{s.label}</span>
                  <span className="w-20 text-right text-[12px] text-fg-subtle">{new Date(e.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {open && (
        <Detail
          key={open.id}
          enquiry={open}
          staff={staff}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={() => setOpenId(null)}
          onPatch={(body, done) => patch(open.id, body, done)}
          onDelete={() => remove(open)}
        />
      )}
      {toast.node}
    </div>
  );
}

function Detail({
  enquiry: e,
  staff,
  canEdit,
  canDelete,
  onClose,
  onPatch,
  onDelete,
}: {
  enquiry: Enquiry;
  staff: StaffOption[];
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  onPatch: (body: Record<string, unknown>, done: string) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const esc = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const wa = e.phone ? digits(e.phone) : "";

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/40" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Enquiry from ${e.name}`}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-surface p-5 shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[20px] font-semibold tracking-tight text-fg">{e.name}</h2>
            <p className="text-[13px] text-fg-subtle">
              {e.type} · {new Date(e.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <button type="button" onClick={onClose} className={quietButton} aria-label="Close">
            Close
          </button>
        </div>

        {/* One-tap contact */}
        <div className="mt-4 flex flex-wrap gap-2">
          {wa && (
            <a className={primaryButton} href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          )}
          {e.phone && (
            <a className={quietButton} href={`tel:${e.phone.replace(/[^\d+]/g, "")}`}>
              Call
            </a>
          )}
          {e.email && (
            <a className={quietButton} href={`mailto:${encodeURIComponent(e.email).replace("%40", "@")}?subject=${encodeURIComponent("Your enquiry to SwiftDrop")}`}>
              Email
            </a>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2 text-[14px]">
          {e.company && (<><dt className="text-fg-subtle">Business</dt><dd className="text-fg">{e.company}</dd></>)}
          {e.email && (<><dt className="text-fg-subtle">Email</dt><dd className="break-all text-fg">{e.email}</dd></>)}
          {e.phone && (<><dt className="text-fg-subtle">Phone</dt><dd className="text-fg">{e.phone}</dd></>)}
          {e.city && (<><dt className="text-fg-subtle">City</dt><dd className="text-fg">{e.city}</dd></>)}
        </dl>
        <p className="mt-4 whitespace-pre-wrap rounded-xl border border-line bg-surface-2 p-3 text-[14px] leading-relaxed text-fg">{e.message}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-[13px] font-medium text-fg">
            Status
            <select className={inputClass} value={e.status} disabled={!canEdit} onChange={(ev) => onPatch({ status: ev.target.value }, `Marked as ${enquiryStatusLabel(ev.target.value)}.`)}>
              {ENQUIRY_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[13px] font-medium text-fg">
            Assigned to
            <select className={inputClass} value={e.assignedTo ?? ""} disabled={!canEdit} onChange={(ev) => onPatch({ assignedTo: ev.target.value || null }, "Assignment saved.")}>
              <option value="">Nobody yet</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.email}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[13px] font-medium text-fg sm:col-span-2">
            Follow-up reminder
            <input
              type="date"
              className={inputClass}
              value={e.followUpOn ?? ""}
              disabled={!canEdit}
              onChange={(ev) => onPatch({ followUpOn: ev.target.value || null }, ev.target.value ? "Reminder set." : "Reminder removed.")}
            />
            <span className="mt-1 block text-[12px] font-normal text-fg-subtle">It shows on the Website overview on that day, and as overdue after it.</span>
          </label>
        </div>

        <h3 className="mt-6 text-[14px] font-semibold text-fg">Notes (only staff see these)</h3>
        <ul className="mt-2 space-y-2">
          {e.notes.map((n, i) => (
            <li key={i} className="rounded-xl border border-line p-3">
              <p className="whitespace-pre-wrap text-[14px] text-fg">{n.text}</p>
              <p className="mt-1 text-[12px] text-fg-subtle">
                {n.by} · {new Date(n.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </li>
          ))}
          {!e.notes.length && <li className="text-[13px] text-fg-subtle">No notes yet.</li>}
        </ul>
        {canEdit && (
          <form
            className="mt-3"
            onSubmit={async (ev) => {
              ev.preventDefault();
              if (!note.trim()) return;
              setBusy(true);
              if (await onPatch({ note: note.trim() }, "Note added.")) setNote("");
              setBusy(false);
            }}
          >
            <textarea className={inputClass} rows={3} maxLength={2000} placeholder="What happened on the call? What's the next step?" value={note} onChange={(ev) => setNote(ev.target.value)} />
            <button type="submit" disabled={busy || !note.trim()} className={`${primaryButton} mt-2`}>
              {busy ? "Saving…" : "Add note"}
            </button>
          </form>
        )}

        {canDelete && (
          <div className="mt-8 border-t border-line pt-4">
            <button type="button" onClick={onDelete} className={dangerButton}>
              Delete this enquiry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
