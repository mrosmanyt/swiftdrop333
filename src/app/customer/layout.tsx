import PortalSidebar, { type SidebarLink } from "@/components/portal/PortalSidebar";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const LINKS: SidebarLink[] = [
  { href: "/customer", label: "Dashboard", icon: <Icon d="M3 12l9-9 9 9M5 10v10h14V10" /> },
  { href: "/customer/orders", label: "Order History", icon: <Icon d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3zM9 7v13M15 4v13" /> },
  { href: "/customer/addresses", label: "Saved Addresses", icon: <Icon d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" /> },
  { href: "/customer/loyalty", label: "Loyalty & Referrals", icon: <Icon d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8-5.1-4.7 6.9-.8z" /> },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <PortalSidebar brand="Customer" homeHref="/customer" groups={[{ links: LINKS }]} />
      <main className="px-4 py-8 sm:px-6 md:ml-56">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
