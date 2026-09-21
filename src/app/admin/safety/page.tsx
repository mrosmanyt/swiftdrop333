"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/portal/ui";

interface Incident {
  id: string;
  courierFullName: string | null;
  courierPhone: string | null;
  courierEmail: string;
  orderId: string | null;
  lat: number | null;
  lng: number | null;
  note: string | null;
  status: string;
  createdAt: string;
}

export default function AdminSafetyPage() {
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/safety", { cache: "no-store" });
    if (res.ok) setIncidents((await res.json()).incidents ?? []);
  }

  useEffect(() => {
    load();
    // A live emergency shouldn't need a manual refresh — poll the same way
    // the rest of the live-ops screens do.
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  async function resolve(id: string) {
    setBusy(id);
    await fetch(`/api/admin/safety/${id}/resolve`, { method: "POST" });
    setBusy(null);
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Rider Safety" subtitle="SOS presses and open safety incidents, newest first." />

      <Card bodyClassName="">
        {incidents === null ? (
          <p className="p-4 text-sm text-fg-muted">Loading…</p>
        ) : incidents.length ? (
          <ul className="divide-y divide-line">
            {incidents.map((inc) => (
              <li key={inc.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 font-medium text-fg">
                    🆘 {inc.courierFullName ?? inc.courierEmail}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        inc.status === "open" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn"
                      }`}
                    >
                      {inc.status}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[13px] text-fg-muted">
                    {inc.courierPhone ?? inc.courierEmail}
                    {inc.orderId && ` · mid-delivery on order ${inc.orderId.slice(0, 8)}`}
                  </p>
                  <p className="mt-0.5 text-[12px] text-fg-subtle">
                    {new Date(inc.createdAt).toLocaleString()}
                    {inc.lat != null && inc.lng != null ? (
                      <>
                        {" · "}
                        <a
                          className="text-accent hover:underline"
                          href={`https://www.openstreetmap.org/?mlat=${inc.lat}&mlon=${inc.lng}#map=16/${inc.lat}/${inc.lng}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View location
                        </a>
                      </>
                    ) : (
                      " · no location attached"
                    )}
                  </p>
                  {inc.note && <p className="mt-1 text-[13px] text-fg">{inc.note}</p>}
                </div>
                <button
                  onClick={() => resolve(inc.id)}
                  disabled={busy === inc.id}
                  className="shrink-0 rounded-lg bg-ok-soft px-3 py-1.5 text-[13px] font-medium text-ok hover:opacity-80 disabled:opacity-50"
                >
                  Mark resolved
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No open safety incidents" hint="An SOS press from a courier shows up here instantly." />
        )}
      </Card>
    </div>
  );
}
