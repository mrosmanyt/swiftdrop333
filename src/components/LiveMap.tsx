"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "./LiveMapInner";

export type { MapMarker };

// Leaflet touches `window` at import time, so it's loaded client-only.
const LiveMapInner = dynamic(() => import("./LiveMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
      Loading map…
    </div>
  ),
});

export default LiveMapInner;
