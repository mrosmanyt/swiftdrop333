import PortalSidebar, { type SidebarLink } from "@/components/portal/PortalSidebar";
import DriverLocationControl from "@/components/DriverLocationControl";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const LINKS: SidebarLink[] = [
  { href: "/driver/offers", label: "Offers", icon: <Icon d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /> },
  { href: "/driver/earnings", label: "Earnings", icon: <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> },
  { href: "/driver/demand", label: "Demand & Routes", icon: <Icon d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3zM9 7v13M15 4v13" /> },
  { href: "/driver/pay", label: "Pay", icon: <Icon d="M2 7h20v4H2zM2 7v10h20V7M6 15h4" /> },
  { href: "/driver/documents", label: "Documents", icon: <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6" /> },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* The online / location control sits in the header on every page: a
          courier who has drifted offline needs to see that everywhere, not
          only on the screen where they turned it on. */}
      <PortalSidebar
        brand="Driver"
        homeHref="/driver/offers"
        groups={[{ links: LINKS }]}
        headerExtra={<DriverLocationControl />}
      />
      {/* md:ml-56 matches the sidebar's fixed width so content never sits
          underneath it; on phones there's no sidebar to offset. */}
      <main className="px-4 py-8 sm:px-6 md:ml-56">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
