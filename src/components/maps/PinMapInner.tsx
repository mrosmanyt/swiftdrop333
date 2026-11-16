"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface PinMapProps {
  /** Where to drop the pin. null = show the whole of Canada. */
  point: { lat: number; lng: number; label?: string } | null;
  /** Extra dots, e.g. the cities we serve. */
  dots?: { lat: number; lng: number; label: string }[];
  className?: string;
}

const CANADA: [number, number] = [56.5, -96.5];

/**
 * A zoomable OpenStreetMap map with one pin (free tiles, no API key).
 * Used beside the business sign-up form and on the Cities page.
 */
export default function PinMapInner({ point, dots = [], className = "h-[420px]" }: PinMapProps) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const pin = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { zoomControl: true, scrollWheelZoom: false }).setView(CANADA, 3);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(m);
    // Scroll-wheel zoom only after a click, so the page can still be scrolled past the map.
    m.on("click", () => m.scrollWheelZoom.enable());
    m.on("mouseout", () => m.scrollWheelZoom.disable());
    for (const d of dots) {
      L.circleMarker([d.lat, d.lng], { radius: 7, color: "#fff", weight: 2, fillColor: "#1d58d9", fillOpacity: 1 })
        .addTo(m)
        .bindTooltip(d.label, { direction: "top", offset: [0, -6] });
    }
    if (dots.length > 1) m.fitBounds(L.latLngBounds(dots.map((d) => [d.lat, d.lng] as [number, number])), { padding: [36, 36] });
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      pin.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (pin.current) {
      pin.current.remove();
      pin.current = null;
    }
    if (!point) return;
    const icon = L.divIcon({
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#1d58d9;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35)"></div>',
    });
    pin.current = L.marker([point.lat, point.lng], { icon }).addTo(m);
    if (point.label) pin.current.bindTooltip(point.label, { direction: "top", offset: [0, -28] });
    m.flyTo([point.lat, point.lng], 15, { duration: 0.8 });
  }, [point]);

  return <div ref={box} className={`w-full overflow-hidden rounded-2xl ${className}`} role="img" aria-label="Map" />;
}
