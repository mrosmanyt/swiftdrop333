/**
 * Canada-only reference data shared by the public site, the sign-up form
 * and the zone price calculator. No server-only imports — safe in the browser.
 */

export const PROVINCES = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
] as const;

export type ProvinceCode = (typeof PROVINCES)[number]["value"];
export const PROVINCE_CODES = PROVINCES.map((p) => p.value) as [ProvinceCode, ...ProvinceCode[]];

/** "Ontario" / "ontario" / "ON" -> "ON" (undefined when it isn't a province). */
export function provinceCode(name: string | undefined | null): ProvinceCode | undefined {
  const v = (name ?? "").trim().toLowerCase();
  if (!v) return undefined;
  return PROVINCES.find((p) => p.value.toLowerCase() === v || p.label.toLowerCase() === v)?.value;
}

/** Canadian postal code, with or without the space: "K1Z 7H1". */
export const POSTAL_CODE_PATTERN = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

export function formatPostalCode(raw: string): string {
  const v = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return v.length > 3 ? `${v.slice(0, 3)} ${v.slice(3)}` : v;
}

/**
 * The cities SwiftDrop serves. `radiusKm` is how far from the centre we
 * deliver. The marketing text for each city is edited in the admin console
 * (Website → Cities page); the coordinates stay here because the zone
 * calculator and the maps depend on them.
 */
export const SERVICE_CITIES = [
  { slug: "toronto", name: "Toronto", province: "ON", lat: 43.6532, lng: -79.3832, radiusKm: 40 },
  { slug: "ottawa", name: "Ottawa", province: "ON", lat: 45.4215, lng: -75.6972, radiusKm: 35 },
  { slug: "hamilton", name: "Hamilton", province: "ON", lat: 43.2557, lng: -79.8711, radiusKm: 30 },
  { slug: "oshawa", name: "Oshawa", province: "ON", lat: 43.8971, lng: -78.8658, radiusKm: 25 },
  { slug: "vancouver", name: "Vancouver", province: "BC", lat: 49.2827, lng: -123.1207, radiusKm: 40 },
  { slug: "calgary", name: "Calgary", province: "AB", lat: 51.0447, lng: -114.0719, radiusKm: 35 },
  { slug: "edmonton", name: "Edmonton", province: "AB", lat: 53.5461, lng: -113.4938, radiusKm: 35 },
  { slug: "winnipeg", name: "Winnipeg", province: "MB", lat: 49.8951, lng: -97.1384, radiusKm: 30 },
] as const;

export type ServiceCity = (typeof SERVICE_CITIES)[number];

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** The served city a point belongs to, or null when it is outside every service area. */
export function serviceCityFor(lat: number, lng: number): ServiceCity | null {
  let best: { city: ServiceCity; d: number } | null = null;
  for (const city of SERVICE_CITIES) {
    const d = distanceKm(lat, lng, city.lat, city.lng);
    if (d <= city.radiusKm && (!best || d < best.d)) best = { city, d };
  }
  return best?.city ?? null;
}
