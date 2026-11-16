"use client";

import dynamic from "next/dynamic";
import type { PinMapProps } from "./PinMapInner";

// Leaflet touches `window` when it loads, so the map is client-only.
const PinMap = dynamic<PinMapProps>(() => import("./PinMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-2xl bg-surface-2 text-sm text-fg-subtle">
      Loading map…
    </div>
  ),
});

export default PinMap;
