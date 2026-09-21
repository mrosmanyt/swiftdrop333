import type { Metadata } from "next";
import PortalNav from "@/components/portal/PortalNav";

/**
 * The admin console is internal-only: it is never linked from the public
 * site and is explicitly excluded from search engines (see also
 * src/app/robots.ts). Access is still enforced server-side by the role
 * check in src/middleware.ts — this only keeps it out of search results.
 */
export const metadata: Metadata = {
  title: "Internal",
  robots: { index: false, follow: false, nocache: true },
};

const LINKS = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/live-map", label: "Live map" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/operations", label: "Operations" },
  { href: "/admin/support", label: "Trust & support" },
  { href: "/admin/forecast", label: "Forecast" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/merchants", label: "Merchants" },
  { href: "/admin/couriers", label: "Couriers" },
  { href: "/admin/zones", label: "Zones & pricing" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <PortalNav brand="Admin" links={LINKS} width="max-w-6xl" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
