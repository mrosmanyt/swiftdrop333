"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "@/components/ThemeToggle";

/** Links and button text come from Website → Menu, footer & contact details. */
export default function MarketingNav({
  links: LINKS,
  signInLabel,
  ctaLabel,
}: {
  links: { href: string; label: string }[];
  signInLabel: string;
  ctaLabel: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      // Sits just under the announcement bar when there is one (0px otherwise).
      style={{ top: "var(--announce-h, 0px)" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-line bg-bg/90 backdrop-blur-md" : "border-b border-transparent bg-bg"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="SwiftDrop home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={`${l.href}-${l.label}`}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[14.5px] font-medium text-fg/80 transition-colors hover:bg-fg/[0.06] hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-full px-3.5 py-2 text-[14.5px] font-medium text-fg/80 transition-colors hover:text-fg"
          >
            {signInLabel}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-inverse px-5 py-2.5 text-[14.5px] font-semibold text-inverse-fg transition-opacity hover:opacity-90"
          >
            {ctaLabel}
          </Link>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-fg-muted"
            aria-label="Menu"
            aria-expanded={open}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line bg-bg/95 px-5 py-4 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={`${l.href}-${l.label}`}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-fg-muted hover:bg-fg/5 hover:text-fg"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-line pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-line px-3 py-2.5 text-center text-sm text-fg/80"
              >
                {signInLabel}
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg bg-inverse px-3 py-2.5 text-center text-sm font-medium text-inverse-fg"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
