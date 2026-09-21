import PortalSidebar, { type SidebarLink } from "@/components/portal/PortalSidebar";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const LINKS: SidebarLink[] = [
  { href: "/merchant/dashboard", label: "Dashboard", icon: <Icon d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" /> },
  { href: "/merchant/orders", label: "Orders", icon: <Icon d="M4 4h16v4H4zM6 8v12h12V8M9 12h6" /> },
  { href: "/merchant/orders/new", label: "New delivery", icon: <Icon d="M12 5v14M5 12h14" /> },
  { href: "/merchant/analytics", label: "Analytics", icon: <Icon d="M3 3v18h18M7 16l4-6 3 4 5-8" /> },
  { href: "/merchant/tools", label: "Tools & API", icon: <Icon d="M14.7 6.3a4 4 0 1 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4z" /> },
  { href: "/merchant/support", label: "Support", icon: <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <PortalSidebar brand="Merchant" homeHref="/merchant/dashboard" groups={[{ links: LINKS }]} />
      {/* md:ml-56 matches the sidebar's fixed width so content never sits
          underneath it; on phones there's no sidebar to offset. */}
      <main className="px-4 py-8 sm:px-6 md:ml-56">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
