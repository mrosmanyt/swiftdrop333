"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, StatusBadge, TableWrap, orderRef } from "@/components/portal/ui";
import { ORDER_STATUS_LABEL } from "@/lib/types";

const ACTIVE = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];
type Delivery = {
  id: string;
  customerName: string;
  dropoffAddress: string;
  status: string;
  serviceType: string;
  priceCents: number;
};

export default function RecentDeliveries({ orders }: { orders: Delivery[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const term = query.trim().toLowerCase();
  const filtered = orders.filter(order =>
    (status === "all" || order.status === status) &&
    (!term || [order.customerName, order.dropoffAddress, orderRef(order.id), order.id]
      .some(value => value.toLowerCase().includes(term)))
  );
  const reset = () => { setQuery(""); setStatus("all"); };
  return (
    <>
      <div className="flex flex-wrap items-end gap-3 border-b border-line p-4">
        <label className="min-w-0 flex-1 basis-56 text-[13px] text-fg-muted">
          Search recent deliveries
          <input type="search" value={query} onChange={event => setQuery(event.target.value)}
            placeholder="Customer, address or reference"
            className="mt-1.5 block min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" />
        </label>
        <label className="text-[13px] text-fg-muted">
          Status
          <select value={status} onChange={event => setStatus(event.target.value)}
            className="mt-1.5 block min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <option value="all">All statuses</option>
            {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        {(query || status !== "all") && <button type="button" onClick={reset}
          className="min-h-11 rounded-lg px-3 text-sm text-accent hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Clear filters</button>}
      </div>
      <p role="status" className="px-4 py-2 text-xs text-fg-subtle">
        {filtered.length} of {orders.length} recent deliveries
      </p>
      {filtered.length ? (
          <TableWrap>
            <table className="w-full text-left text-sm">
              <thead className="text-[12.5px] uppercase tracking-wide text-fg-subtle">
                <tr className="border-b border-line">
                  <th className="px-4 py-2.5 font-medium">Delivery</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Service</th>
                  <th className="px-4 py-2.5 text-right font-medium">Price</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o!.id} className="border-b border-line last:border-0 hover:bg-fg/[0.02]">
                    <td className="px-4 py-3">
                      {/* The customer and where it's going is what a merchant
                          recognises; the reference is for phone calls. */}
                      <p className="font-medium text-fg">{o!.customerName}</p>
                      <p className="mt-0.5 max-w-[26ch] truncate text-[12.5px] text-fg-subtle sm:max-w-[40ch]">
                        {orderRef(o!.id)} · {o!.dropoffAddress}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o!.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                      {o!.serviceType.toLowerCase().replace(/_/g, " ")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                      ${(o!.priceCents / 100).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/merchant/orders/${o!.id}`} className="text-accent hover:underline">
                        {ACTIVE.includes(o!.status) ? "Track" : "Details"} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
      ) : (
        <EmptyState title="No matching deliveries" hint="Try another customer, address, reference or status."
          action={<button type="button" onClick={reset} className="min-h-11 rounded-lg border border-line px-4 text-sm text-accent hover:bg-bg-soft">Clear filters</button>} />
      )}
    </>
  );
}
