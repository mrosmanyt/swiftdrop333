/**
 * Geocoding + routing, with graceful degradation.
 *
 * Default provider is Photon (photon.komoot.io) — OpenStreetMap-based,
 * free, and needs no API key, so the app works out of the box. Set
 * GEOCODER=google|mapbox|nominatim in .env (plus the matching key) if you
 * later want higher-volume commercial geocoding.
 *
 * Every function here is written to FAIL SOFT: if the provider is
 * unreachable (no internet, blocked egress, rate limit), address lookup
 * returns an empty list flagged `degraded`, and distance falls back to a
 * straight-line estimate. An order can always still be created — the
 * address is kept as typed text.
 */

export interface AddressSuggestion {
  label: string;
  lat: number;
  lng: number;
  city?: string;
  postcode?: string;
}

const PROVIDER = process.env.GEOCODER ?? "photon";
const COUNTRY = process.env.GEOCODER_COUNTRY ?? "Canada";
const TIMEOUT_MS = 6000;

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        // Nominatim/Photon usage policy asks for an identifying User-Agent.
        "User-Agent": "SwiftDrop/1.0 (local delivery platform)",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Autocomplete an address string. Returns [] (degraded) if lookup fails. */
export async function searchAddress(
  query: string,
  bias?: { lat: number; lng: number }
): Promise<{ suggestions: AddressSuggestion[]; degraded: boolean }> {
  if (query.trim().length < 3) return { suggestions: [], degraded: false };

  try {
    if (PROVIDER === "google" && process.env.GOOGLE_MAPS_SERVER_KEY) {
      return { suggestions: await searchGoogle(query), degraded: false };
    }
    if (PROVIDER === "mapbox" && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      return { suggestions: await searchMapbox(query, bias), degraded: false };
    }
    if (PROVIDER === "nominatim") {
      return { suggestions: await searchNominatim(query), degraded: false };
    }
    return { suggestions: await searchPhoton(query, bias), degraded: false };
  } catch {
    // Provider unreachable — the UI falls back to plain manual entry.
    return { suggestions: [], degraded: true };
  }
}

async function searchPhoton(query: string, bias?: { lat: number; lng: number }) {
  const params = new URLSearchParams({ q: query, limit: "6", lang: "en" });
  if (bias) {
    params.set("lat", String(bias.lat));
    params.set("lon", String(bias.lng));
  }
  const res = await fetchWithTimeout(`https://photon.komoot.io/api?${params}`);
  if (!res.ok) throw new Error(`photon ${res.status}`);
  const data = await res.json();

  return (data.features ?? [])
    .filter((f: any) => !COUNTRY || f.properties?.country === COUNTRY)
    .map((f: any): AddressSuggestion => {
      const p = f.properties ?? {};
      const line = [
        [p.housenumber, p.street].filter(Boolean).join(" ") || p.name,
        p.city ?? p.district,
        p.state,
        p.postcode,
      ]
        .filter(Boolean)
        .join(", ");
      return {
        label: line,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        city: p.city,
        postcode: p.postcode,
      };
    })
    .filter((s: AddressSuggestion) => s.label.length > 0);
}

async function searchNominatim(query: string) {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "6",
    addressdetails: "1",
    countrycodes: "ca",
  });
  const res = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = await res.json();
  return (data ?? []).map(
    (r: any): AddressSuggestion => ({
      label: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
      city: r.address?.city ?? r.address?.town,
      postcode: r.address?.postcode,
    })
  );
}

async function searchMapbox(query: string, bias?: { lat: number; lng: number }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
  const params = new URLSearchParams({ access_token: token, country: "ca", limit: "6" });
  if (bias) params.set("proximity", `${bias.lng},${bias.lat}`);
  const res = await fetchWithTimeout(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
  );
  if (!res.ok) throw new Error(`mapbox ${res.status}`);
  const data = await res.json();
  return (data.features ?? []).map(
    (f: any): AddressSuggestion => ({
      label: f.place_name,
      lat: f.center[1],
      lng: f.center[0],
    })
  );
}

async function searchGoogle(query: string) {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY!;
  const params = new URLSearchParams({ address: query, key, components: "country:CA" });
  const res = await fetchWithTimeout(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
  if (!res.ok) throw new Error(`google ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map(
    (r: any): AddressSuggestion => ({
      label: r.formatted_address,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
    })
  );
}

// ---------------------------------------------------------------------------
// Distance / routing
// ---------------------------------------------------------------------------

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Straight-line distance under-states real driving distance in a city.
 * 1.35 is the commonly used urban detour factor — used when road routing
 * isn't available so pricing stays realistic instead of too cheap.
 */
export const URBAN_DETOUR_FACTOR = 1.35;

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  source: "osrm" | "estimate";
}

/**
 * Real road distance + duration via OSRM's public server (free, no key).
 * Falls back to a detour-adjusted straight line if it's unreachable.
 */
export async function routeBetween(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  vehicleType?: string | null
): Promise<RouteResult> {
  try {
    const profile = vehicleType === "BIKE" ? "cycling" : "driving";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`osrm ${res.status}`);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new Error("no route");
    return {
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      source: "osrm",
    };
  } catch {
    const straight = haversineKm(from.lat, from.lng, to.lat, to.lng);
    const distanceKm = straight * URBAN_DETOUR_FACTOR;
    const speedKmh = vehicleType === "BIKE" ? 16 : vehicleType === "SCOOTER" ? 26 : 30;
    return { distanceKm, durationMin: (distanceKm / speedKmh) * 60, source: "estimate" };
  }
}
