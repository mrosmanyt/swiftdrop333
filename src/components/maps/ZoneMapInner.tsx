"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ZONE_COLORS } from "@/lib/site/zones";

export interface ZoneMapProps {
  pickup: { lat: number; lng: number } | null;
  dropoff: { lat: number; lng: number } | null;
  /** Outer edge of each zone in km, nearest first. */
  ringsKm: number[];
  /** Zone to emphasise (1-based), e.g. the one the drop-off is in or the row being hovered. */
  highlight: number | null;
}

/** Map for the price calculator: the pickup point, one coloured ring per zone, and the drop-off pin. */
export default function ZoneMapInner({ pickup, dropoff, ringsKm, highlight }: ZoneMapProps) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { zoomControl: true, scrollWheelZoom: false }).setView([56.5, -96.5], 3);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(m);
    m.on("click", () => m.scrollWheelZoom.enable());
    m.on("mouseout", () => m.scrollWheelZoom.disable());
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Rings + pins. Re-drawn whenever the inputs change; the view only moves when the pickup does.
  const lastPickup = useRef<string>("");
  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    if (!pickup) return;

    // Furthest ring first so nearer rings sit on top and stay clickable.
    [...ringsKm].reverse().forEach((km, idx) => {
      const n = ringsKm.length - idx;
      const on = highlight === n;
      L.circle([pickup.lat, pickup.lng], {
        radius: km * 1000,
        color: ZONE_COLORS[(n - 1) % ZONE_COLORS.length],
        weight: on ? 3.5 : 1.5,
        opacity: on ? 1 : 0.75,
        fillColor: ZONE_COLORS[(n - 1) % ZONE_COLORS.length],
        fillOpacity: on ? 0.22 : 0.05,
      })
        .addTo(g)
        .bindTooltip(`Zone ${n}`, { sticky: true });
    });
    L.circleMarker([pickup.lat, pickup.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#111827", fillOpacity: 1 })
      .addTo(g)
      .bindTooltip("Pickup", { direction: "top" });
    if (dropoff) {
      L.circleMarker([dropoff.lat, dropoff.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#dc2626", fillOpacity: 1 })
        .addTo(g)
        .bindTooltip("Drop-off", { direction: "top" });
    }

    const key = `${pickup.lat},${pickup.lng},${ringsKm.length}`;
    if (key !== lastPickup.current && ringsKm.length) {
      lastPickup.current = key;
      const outer = L.circle([pickup.lat, pickup.lng], { radius: ringsKm[ringsKm.length - 1] * 1000 });
      outer.addTo(m);
      m.fitBounds(outer.getBounds(), { padding: [16, 16] });
      outer.remove();
    }
  }, [pickup, dropoff, ringsKm, highlight]);

  return <div ref={box} className="h-[360px] w-full overflow-hidden rounded-2xl lg:h-[520px]" role="img" aria-label="Map of delivery zones" />;
}
