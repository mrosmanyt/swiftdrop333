"use client";

import LiveMap, { MapMarker } from "./LiveMap";

interface DemandZone {
  zoneId: string;
  zoneName: string;
  city: string;
  waiting: number;
  orderCount: number;
  avgLat: number | null;
  avgLng: number | null;
}

/** Visual companion to the demand list below it — each zone with known coordinates becomes a colored, sized circle so the busiest spot is obvious at a glance, not just a number in a table. */
export default function DemandMap({ zones }: { zones: DemandZone[] }) {
  const withCoords = zones.filter((z) => z.avgLat != null && z.avgLng != null);
  const busiest = Math.max(1, ...withCoords.map((z) => z.orderCount));

  const markers: MapMarker[] = withCoords.map((z) => ({
    id: z.zoneId,
    lat: z.avgLat as number,
    lng: z.avgLng as number,
    label: `${z.city} — ${z.zoneName}: ${z.waiting} waiting · ${z.orderCount} in 24h`,
    kind: "heat",
    intensity: z.orderCount / busiest,
  }));

  if (!markers.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-line text-sm text-fg-subtle">
        No located demand yet — the list below still works, this just needs pickup coordinates to plot.
      </div>
    );
  }

  return <LiveMap markers={markers} height={320} />;
}
