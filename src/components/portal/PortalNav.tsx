"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import SignOutButton from "@/components/SignOutButton";

export type PortalLink = { href: string; label: string };

/**
 * The top bar shared by the merchant, driver and admin portals.
 *
 * The admin console has eleven destinations, which is more than fits on a
 * laptop and far more than fits on a phone, so the link row scrolls
 * horizontally with edge fades instead of wrapping into a second line that
 * pushes the page content down. The current section is highlighted — before
 * this, every portal page looked identical at a glance.
 */
export default function PortalNav({
  brand,
  links,
  width = "max-w-6xl",
  children,
}: {
  brand: string;
  links: PortalLink[];
  width?: string;
  children?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      setEdges({
        left: el.scrollLeft > 4,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [links.length]);

  // Keep the active link in view when arriving directly on a deep page.
  useEffect(() => {
    scroller.current?.querySelector('[data-active="true"]')?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    pathname === href || (pathname.startsWith(href + "/") && href.split("/").length > 2);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
      {/* The header spans wider than the page content on purpose: the driver
          portal is a narrow 3xl column, and squeezing five nav links into
          that width leaves them permanently half-scrolled. */}
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href={links[0]?.href ?? "/"} className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-bright to-accent">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path d="M3 13.5 10.5 6l4 4L21 3.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10.5" cy="6" r="1.6" fill="white" />
              <path d="M4 20h16" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
            </svg>
          </span>
          <span className="hidden text-[15px] font-semibold tracking-tight text-fg sm:inline">
            SwiftDrop
          </span>
          <span className="hidden text-[15px] font-medium text-fg-subtle lg:inline">· {brand}</span>
        </Link>

        {/* Desktop / tablet: one scrollable row */}
        <div className="relative hidden min-w-0 flex-1 md:block">
          {edges.left && (
            <span className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-bg to-transparent" />
          )}
          {edges.right && (
            <span className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-bg to-transparent" />
          )}
          <div
            ref={scroller}
            className="no-scrollbar flex items-center gap-0.5 overflow-x-auto scroll-smooth"
          >
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  data-active={active}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[13.5px] transition-colors ${
                    active
                      ? "bg-accent/10 font-medium text-accent"
                      : "text-fg-muted hover:bg-fg/5 hover:text-fg"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <ThemeToggle className="h-8 w-8" />
          <span className="hidden sm:inline">
            <SignOutButton />
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="rounded-lg border border-line p-1.5 text-fg-muted md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-bg px-4 py-2 md:hidden">
          <div className="grid gap-0.5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm ${
                  isActive(l.href)
                    ? "bg-accent/10 font-medium text-accent"
                    : "text-fg-muted hover:bg-fg/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-1 border-t border-line pt-2 sm:hidden">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}

      {children && (
        <div className={`mx-auto px-4 pb-2.5 sm:px-6 ${width}`}>{children}</div>
      )}
    </header>
  );
}
