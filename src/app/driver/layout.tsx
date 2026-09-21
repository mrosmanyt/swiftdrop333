import PortalNav from "@/components/portal/PortalNav";
import DriverLocationControl from "@/components/DriverLocationControl";

const LINKS = [
  { href: "/driver/offers", label: "Offers" },
  { href: "/driver/earnings", label: "Earnings" },
  { href: "/driver/demand", label: "Demand & Routes" },
  { href: "/driver/pay", label: "Pay" },
  { href: "/driver/documents", label: "Documents" },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* The online / location control sits in the header on every page: a
          courier who has drifted offline needs to see that everywhere, not
          only on the screen where they turned it on. */}
      <PortalNav brand="Driver" links={LINKS} width="max-w-3xl">
        <DriverLocationControl />
      </PortalNav>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
