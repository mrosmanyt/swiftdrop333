"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import SignOutButton from "@/components/SignOutButton";

export type SidebarLink = { href: string; label: string; icon?: React.ReactNode };
export type SidebarGroup = { title?: string; links: SidebarLink[] };

/**
 * Shared left-sidebar navigation for every signed-in portal (admin,
 * merchant, driver). Originally built just for admin — which has a dozen
 * destinations, too many for a single horizontal row — but the same layout
 * was rolled out to merchant and driver too so all three portals share one
 * consistent navigation pattern instead of admin looking different from
 * the other two. Fixed sidebar on desktop/tablet, full-screen slide-out
 * menu on phones.
 */
export default function PortalSidebar({
  brand,
  homeHref,
  groups,
  headerExtra,
}: {
  brand: string;
  homeHref: string;
  groups: SidebarGroup[];
  /** Extra header content, e.g. the driver's online/offline toggle. */
  headerExtra?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    pathname === href || (pathname.startsWith(href + "/") && href.split("/").length > 2);

  const NavLinks = () => (
    <nav className="flex flex-col gap-5">
      {groups.map((g, i) => (
        <div key={g.title ?? i}>
          {g.title && (
            <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
              {g.title}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {g.links.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-colors ${
                    active
                      ? "bg-accent/10 font-medium text-accent"
                      : "text-fg-muted hover:bg-fg/5 hover:text-fg"
                  }`}
                >
                  {l.icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center">{l.icon}</span>}
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Top bar — always visible, holds the brand + the mobile menu trigger. */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-xl sm:px-6">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg border border-line p-1.5 text-fg-muted md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        </button>
        <Link href={homeHref} className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-bright to-accent">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path d="M3 13.5 10.5 6l4 4L21 3.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10.5" cy="6" r="1.6" fill="white" />
              <path d="M4 20h16" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-fg">SwiftDrop</span>
          <span className="hidden text-[15px] font-medium text-fg-subtle sm:inline">· {brand}</span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {headerExtra}
          <ThemeToggle className="h-8 w-8" />
          <span className="hidden sm:inline">
            <SignOutButton />
          </span>
        </div>
      </header>

      {/* Desktop / tablet: fixed left sidebar. */}
      <aside className="fixed inset-y-0 left-0 top-14 hidden w-56 shrink-0 overflow-y-auto border-r border-line bg-bg px-3 py-5 md:block">
        <NavLinks />
      </aside>

      {/* Mobile: full-screen slide-out menu instead of a cramped dropdown. */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[80%] max-w-xs overflow-y-auto bg-bg px-3 py-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between px-3">
              <span className="text-[15px] font-semibold text-fg">Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg border border-line p-1.5 text-fg-muted"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NavLinks />
            <div className="mt-5 border-t border-line px-3 pt-4">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
