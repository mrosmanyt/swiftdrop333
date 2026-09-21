"use client";

import { useEffect, useState } from "react";
import LiveMap, { MapMarker } from "./LiveMap";

interface LiveOrder {
  id: string;
  merchantBusinessName: string;
  customerName: string;
  status: string;
  courierEmail: string | null;
  courierLastLat: number | null;
  courierLastLng: number | null;
  courierLastLocationAt: string | null;
}

/**
 * Admin ops live map — every in-flight delivery's courier position, all at
 * once, polled every 5s. This is the "admin sees everything live" half of
 * the tracking requirement; blueprint §7 called this out as a Phase 2 item
 * and it's now real.
 */
export default function AdminLiveMap() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await fetch("/api/admin/live-orders", { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setOrders(data.orders);
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const markers: MapMarker[] = orders
    .filter((o) => o.courierLastLat != null && o.courierLastLng != null)
    .map((o) => ({
      id: o.id,
      lat: o.courierLastLat as number,
      lng: o.courierLastLng as number,
      label: `${o.courierEmail ?? "Courier"} → ${o.customerName}`,
      kind: "courier" as const,
    }));

  return (
    <div className="space-y-3">
      {markers.length > 0 ? (
        <LiveMap markers={markers} height={360} />
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-line text-sm text-fg-subtle">
          No couriers currently on an active delivery.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="text-fg-subtle">
            <tr>
              <th className="p-3">Merchant</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Courier</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last ping</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td className="p-3">{o.merchantBusinessName}</td>
                <td className="p-3">{o.customerName}</td>
                <td className="p-3">{o.courierEmail ?? "—"}</td>
                <td className="p-3">{o.status}</td>
                <td className="p-3 text-xs text-fg-subtle">
                  {o.courierLastLocationAt ? new Date(o.courierLastLocationAt).toLocaleTimeString() : "no signal yet"}
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td className="p-3 text-fg-subtle" colSpan={5}>
                  No active deliveries right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
