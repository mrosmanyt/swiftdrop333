"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind?: "courier" | "pickup" | "dropoff" | "heat";
  /** "heat" markers only — 0..1, how busy this spot is relative to the busiest one on the map. Drives both size and color. */
  intensity?: number;
}

interface Props {
  markers: MapMarker[];
  height?: number;
  /** If true, the map re-centers to fit all markers whenever they change. */
  autoFit?: boolean;
}

const ICONS: Record<string, string> = {
  pickup: "📦",
  dropoff: "🏠",
};

/**
 * Real Leaflet map using free OpenStreetMap tiles — no API key required.
 * Courier positions render as a live blue dot; pickup/dropoff render as
 * simple emoji pins. Markers update in place (no flicker) as new
 * coordinates arrive from polling.
 */
export default function LiveMapInner({ markers, height = 320, autoFit = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<Map<string, L.CircleMarker | L.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([43.6532, -79.3832], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();

    for (const m of markers) {
      seen.add(m.id);
      const existing = markerLayerRef.current.get(m.id);
      const latlng: L.LatLngExpression = [m.lat, m.lng];

      if (m.kind === "courier") {
        if (existing && existing instanceof L.CircleMarker) {
          existing.setLatLng(latlng);
        } else {
          if (existing) map.removeLayer(existing);
          const marker = L.circleMarker(latlng, {
            radius: 9,
            color: "#fff",
            weight: 2,
            fillColor: "#0F62FE",
            fillOpacity: 1,
          })
            .bindTooltip(m.label, { permanent: false })
            .addTo(map);
          markerLayerRef.current.set(m.id, marker);
        }
      } else if (m.kind === "heat") {
        // A soft, large, low-opacity circle reads as "busy area" at a
        // glance without needing a real heatmap tile layer — radius and
        // color both scale with intensity so hottest zones jump out.
        if (existing) map.removeLayer(existing);
        const t = Math.max(0, Math.min(1, m.intensity ?? 0));
        const color = t > 0.66 ? "#E5484D" : t > 0.33 ? "#F5A623" : "#F5D90A";
        const marker = L.circleMarker(latlng, {
          radius: 18 + t * 32,
          color,
          weight: 0,
          fillColor: color,
          fillOpacity: 0.35 + t * 0.25,
        })
          .bindTooltip(m.label, { permanent: false })
          .addTo(map);
        markerLayerRef.current.set(m.id, marker);
      } else {
        if (existing && existing instanceof L.Marker) {
          existing.setLatLng(latlng);
        } else {
          if (existing) map.removeLayer(existing);
          const icon = L.divIcon({
            html: `<div style="font-size:22px;line-height:1">${ICONS[m.kind ?? "pickup"] ?? "📍"}</div>`,
            className: "",
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });
          const marker = L.marker(latlng, { icon }).bindTooltip(m.label).addTo(map);
          markerLayerRef.current.set(m.id, marker);
        }
      }
    }

    for (const [id, layer] of markerLayerRef.current.entries()) {
      if (!seen.has(id)) {
        map.removeLayer(layer);
        markerLayerRef.current.delete(id);
      }
    }

    if (autoFit && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as L.LatLngExpression));
      map.fitBounds(bounds.pad(0.3), { maxZoom: 15 });
    }
  }, [markers, autoFit]);

  return <div ref={containerRef} style={{ height, width: "100%" }} className="rounded-xl" />;
}
