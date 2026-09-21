import type { MetadataRoute } from "next";

/**
 * Only the public marketing pages should ever be indexed. The internal
 * areas — and especially the admin panel — are kept out of search results
 * so they're not discoverable by anyone browsing the web.
 */
export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/features", "/pricing", "/couriers", "/signup", "/login"],
        disallow: ["/admin", "/merchant", "/driver", "/track", "/api"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
