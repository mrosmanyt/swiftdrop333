import { createHmac, randomUUID } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Cookie-free page-view counting.
 *
 * A visitor is identified only by a hash of (today's secret + IP address +
 * browser name). The secret changes every day, so the hash cannot be linked
 * from one day to the next, and the IP address itself is never stored.
 */

const secret = () => process.env.NEXTAUTH_SECRET || process.env.DATA_ENCRYPTION_KEY || "swiftdrop-local-dev";

export function dailyVisitorHash(ip: string, userAgent: string, day = new Date().toISOString().slice(0, 10)) {
  const dailySalt = createHmac("sha256", secret()).update(`pageviews:${day}`).digest();
  return createHmac("sha256", dailySalt).update(`${ip}|${userAgent}`).digest("hex").slice(0, 32);
}

/** Same idea for the contact form's spam limit (kept with the enquiry, salted per day). */
export const dailyIpHash = (ip: string) => dailyVisitorHash(ip, "enquiry");

const BOT = /bot|crawl|spider|slurp|preview|monitor|lighthouse|headless|curl|wget|python|axios|node-fetch|facebookexternalhit|whatsapp/i;

export function deviceOf(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

const PUBLIC_PATHS = /^\/(|features|pricing|couriers|privacy|contact|products|zones|cities|industries|how-it-works|terms|signup(\/(merchant|courier|customer))?|login)$/;

export async function recordPageView(input: { path: string; referrer: string; ip: string; userAgent: string; host: string }) {
  if (!input.userAgent || BOT.test(input.userAgent)) return false;
  const path = input.path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (!PUBLIC_PATHS.test(path)) return false;

  let referrer: string | null = null;
  try {
    const h = new URL(input.referrer).host.replace(/^www\./, "");
    if (h && h !== input.host.replace(/^www\./, "")) referrer = h.slice(0, 80);
  } catch {}

  const day = new Date().toISOString().slice(0, 10);
  await db
    .prepare(`INSERT INTO cms_pageviews (id, day, path, visitor, device, referrer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), day, path, dailyVisitorHash(input.ip, input.userAgent, day), deviceOf(input.userAgent), referrer, new Date().toISOString());

  // Old rows are trimmed now and then so the table can't grow for ever.
  if (Math.random() < 0.01) {
    const cutoff = new Date(Date.now() - 400 * 86400_000).toISOString().slice(0, 10);
    await db.prepare(`DELETE FROM cms_pageviews WHERE day < ?`).run(cutoff).catch(() => {});
  }
  return true;
}

export async function analyticsSummary(days = 30) {
  const since = new Date(Date.now() - (days - 1) * 86400_000).toISOString().slice(0, 10);
  const [totals, perDay, pages, devices, referrers] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS views, COUNT(DISTINCT day || visitor) AS visitors FROM cms_pageviews WHERE day >= ?`).get(since),
    db.prepare(`SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM cms_pageviews WHERE day >= ? GROUP BY day ORDER BY day`).all(since),
    db.prepare(`SELECT path, COUNT(*) AS views FROM cms_pageviews WHERE day >= ? GROUP BY path ORDER BY views DESC LIMIT 8`).all(since),
    db.prepare(`SELECT device, COUNT(*) AS views FROM cms_pageviews WHERE day >= ? GROUP BY device ORDER BY views DESC`).all(since),
    db
      .prepare(`SELECT referrer, COUNT(*) AS views FROM cms_pageviews WHERE day >= ? AND referrer IS NOT NULL GROUP BY referrer ORDER BY views DESC LIMIT 8`)
      .all(since),
  ]);
  const map = new Map<string, { views: number; visitors: number }>(
    perDay.map((r: any) => [r.day, { views: Number(r.views), visitors: Number(r.visitors) }])
  );
  const series: { day: string; views: number; visitors: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    series.push({ day: d, ...(map.get(d) ?? { views: 0, visitors: 0 }) });
  }
  return {
    views: Number(totals?.views ?? 0),
    visitors: Number(totals?.visitors ?? 0),
    series,
    pages: pages.map((r: any) => ({ label: r.path as string, n: Number(r.views) })),
    devices: devices.map((r: any) => ({ label: r.device as string, n: Number(r.views) })),
    referrers: referrers.map((r: any) => ({ label: r.referrer as string, n: Number(r.views) })),
  };
}
