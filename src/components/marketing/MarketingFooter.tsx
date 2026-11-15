import Link from "next/link";
import Logo from "./Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { getContent, safeHref } from "@/lib/cms/content";

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

const SOCIAL = [
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["x", "X"],
  ["linkedin", "LinkedIn"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
] as const;

/** Text, contact details and social links come from Website → Menu, footer & contact details. */
export default async function MarketingFooter() {
  const site = await getContent("site");
  const waDigits = site.whatsapp.replace(/[^\d]/g, "");
  const social = SOCIAL.map(([key, label]) => ({ label, href: safeHref(site[key]) })).filter((x) => x.href);
  const hasContact = !!(site.phone || waDigits || site.email || site.address || site.hours || social.length || site.showContactLink);
  return (
    <footer className="relative border-t border-line bg-bg">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-muted">
              {site.footerText}
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-fg-subtle">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-pulse-ring" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
              </span>
              {site.footerStatus}
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

        {/* Only appears once contact details have been filled in and published. */}
        {hasContact && (
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-6 text-[13.5px] text-fg-muted">
            {site.showContactLink && (
              <Link href="/contact" className="font-medium text-fg transition-colors hover:text-accent">
                Contact us
              </Link>
            )}
            {site.phone && (
              <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="transition-colors hover:text-fg">
                {site.phone}
              </a>
            )}
            {waDigits && (
              <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-fg">
                WhatsApp
              </a>
            )}
            {site.email && (
              <a href={`mailto:${site.email}`} className="transition-colors hover:text-fg">
                {site.email}
              </a>
            )}
            {site.address &&
              (safeHref(site.mapLink) ? (
                <a href={safeHref(site.mapLink)} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-fg">
                  {site.address}
                </a>
              ) : (
                <span>{site.address}</span>
              ))}
            {site.hours && <span>{site.hours}</span>}
            {social.map((x) => (
              <a key={x.label} href={x.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-fg">
                {x.label}
              </a>
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.footerCopyright}</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-fg">
              Privacy
            </Link>
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
