import PortalNav from "@/components/portal/PortalNav";

const LINKS = [
  { href: "/merchant/dashboard", label: "Dashboard" },
  { href: "/merchant/orders", label: "Orders" },
  { href: "/merchant/orders/new", label: "New delivery" },
  { href: "/merchant/tools", label: "Tools & API" },
  { href: "/merchant/support", label: "Support" },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <PortalNav brand="Merchant" links={LINKS} width="max-w-5xl" />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
