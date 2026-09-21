import Link from "next/link";
import Logo from "./Logo";
import ThemeToggle from "@/components/ThemeToggle";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#coverage", label: "Where we deliver" },
    ],
  },
  {
    title: "For business",
    links: [
      { href: "/signup/merchant", label: "Start delivering" },
      { href: "/merchant/tools", label: "API & webhooks" },
      { href: "/pricing", label: "Rate card" },
      { href: "/login", label: "Merchant sign in" },
    ],
  },
  {
    title: "For couriers",
    links: [
      { href: "/couriers", label: "Drive with SwiftDrop" },
      { href: "/signup/courier", label: "Apply now" },
      { href: "/couriers#tiers", label: "Courier+ tiers" },
      { href: "/login", label: "Courier sign in" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="relative border-t border-line bg-bg">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-muted">
              Same-day local delivery for Canadian businesses. Live tracked, flat-rate, and no
              commission on what you sell.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-fg-subtle">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-pulse-ring" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
              </span>
              All systems operational
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[13px] font-medium text-fg">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13.5px] text-fg-muted transition-colors hover:text-fg"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SwiftDrop Technologies Inc. Made in Canada 🇨🇦</p>
          <div className="flex flex-wrap items-center gap-5">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Courier agreement</span>
            <span>Accessibility</span>
            <ThemeToggle className="h-8 w-8" />
          </div>
        </div>
      </div>
    </footer>
  );
}
