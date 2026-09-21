import type { Metadata } from "next";
import PortalSidebar, { type SidebarLink } from "@/components/portal/PortalSidebar";

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

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// Twelve destinations, grouped so related sections sit together instead of
// one long undifferentiated list — this is what actually fixed the "hard to
// find the right menu" complaint, not just moving links into a sidebar.
const GROUPS: { title: string; links: SidebarLink[] }[] = [
  {
    title: "Overview",
    links: [
      { href: "/admin/dashboard", label: "Overview", icon: <Icon d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" /> },
      { href: "/admin/live-map", label: "Live map", icon: <Icon d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3zM9 7v13M15 4v13" /> },
      { href: "/admin/forecast", label: "Forecast", icon: <Icon d="M3 3v18h18M7 15l4-5 3 3 5-7" /> },
    ],
  },
  {
    title: "Operations",
    links: [
      { href: "/admin/orders", label: "Orders", icon: <Icon d="M4 4h16v4H4zM6 8v12h12V8M9 12h6" /> },
      { href: "/admin/applications", label: "Applications", icon: <Icon d="M9 12l2 2 4-4M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /> },
      { href: "/admin/operations", label: "Operations", icon: <Icon d="M12 2l2.4 4.8L20 8l-4 3.9.9 5.6L12 15l-4.9 2.5.9-5.6L4 8l5.6-1.2z" /> },
      { href: "/admin/support", label: "Trust & support", icon: <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
      { href: "/admin/notifications", label: "Notifications", icon: <Icon d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /> },
    ],
  },
  {
    title: "Accounts",
    links: [
      { href: "/admin/merchants", label: "Merchants", icon: <Icon d="M3 9l1-6h16l1 6M4 9v11h16V9M4 9h16M9 13v4h6v-4" /> },
      { href: "/admin/couriers", label: "Couriers", icon: <Icon d="M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M5 17V7l3-3h6l5 5v8M8 4v4h8" /> },
      { href: "/admin/zones", label: "Zones & pricing", icon: <Icon d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" /> },
    ],
  },
  {
    title: "Records",
    links: [
      { href: "/admin/deleted-records", label: "Deleted records", icon: <Icon d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16zM10 11v6M14 11v6" /> },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <PortalSidebar brand="Admin" homeHref="/admin/dashboard" groups={GROUPS} />
      {/* md:ml-56 matches the sidebar's fixed width so content never sits
          underneath it; on phones there's no sidebar to offset. */}
      <main className="px-4 py-8 sm:px-6 md:ml-56">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
