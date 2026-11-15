/**
 * Small in-memory fixed-window rate limiter.
 *
 * The app runs as a single Node process on one Railway replica, so a module-
 * level Map is shared by every request. If this ever scales to several
 * replicas, swap the Map for Redis (same interface) — otherwise each replica
 * would count separately and the limits would effectively multiply.
 */

type Bucket = { count: number; resetAt: number };

const globalForRl = globalThis as unknown as { __swiftdropRateLimit?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = globalForRl.__swiftdropRateLimit ?? new Map();
globalForRl.__swiftdropRateLimit = buckets;

/**
 * Records one hit against `key` and reports whether it is still within
 * `limit` hits per `windowMs`.
 */
export function hit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;

  // Opportunistic cleanup so the map can't grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }

  return { ok: b.count <= limit, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
}

/** Read-only check (doesn't count a hit). */
export function isBlocked(key: string, limit: number): boolean {
  const b = buckets.get(key);
  return !!b && b.resetAt > Date.now() && b.count >= limit;
}

/** Clears a key — e.g. after a successful login. */
export function reset(key: string) {
  buckets.delete(key);
}

/** Best-effort client IP from proxy headers (Railway sets x-forwarded-for). */
export function clientIp(headers: Headers | Record<string, any> | undefined | null): string {
  if (!headers) return "unknown";
  const get = (name: string): string | null => {
    if (typeof (headers as Headers).get === "function") return (headers as Headers).get(name);
    const v = (headers as Record<string, any>)[name];
    return Array.isArray(v) ? v[0] : v ?? null;
  };
  // The right-most X-Forwarded-For entry is the one appended by our own
  // proxy (Railway's edge); anything to its left is client-controlled and
  // could be spoofed to dodge the limits.
  const real = get("x-real-ip");
  if (real) return real.trim();
  const fwd = get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}
