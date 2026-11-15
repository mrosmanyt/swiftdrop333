"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "swiftdrop-popup-seen";

/**
 * The popup from Website → Popup. Shows after a short wait, on the pages
 * chosen there, and remembers (in this browser only) that it was seen so it
 * respects the "how often" setting.
 */
export default function SitePopup({
  title,
  text,
  image,
  buttonLabel,
  buttonHref,
  pages,
  frequency,
  delaySeconds,
}: {
  title: string;
  text: string;
  image: string;
  buttonLabel: string;
  buttonHref: string;
  pages: string;
  frequency: string;
  delaySeconds: number;
}) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  // Changing the popup's content makes it count as a new popup.
  const version = `${title}|${text}|${image}|${buttonHref}`;

  useEffect(() => {
    if (pages !== "all" && pages !== pathname) return;
    if (frequency !== "always") {
      try {
        const seen = JSON.parse(localStorage.getItem(KEY) ?? "null");
        if (seen?.version === version) {
          if (frequency === "once") return;
          if (frequency === "daily" && Date.now() - Number(seen.at) < 24 * 60 * 60 * 1000) return;
        }
      } catch {
        // Storage can be blocked; then the popup simply shows.
      }
    }
    const t = setTimeout(() => {
      setOpen(true);
      try {
        localStorage.setItem(KEY, JSON.stringify({ version, at: Date.now() }));
      } catch {}
    }, Math.max(0, delaySeconds) * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  if (!open) return null;
  const external = /^https?:\/\//i.test(buttonHref);
  const buttonClass =
    "mt-5 inline-flex w-full items-center justify-center rounded-xl bg-inverse px-5 py-3 text-[14.5px] font-medium text-inverse-fg";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Announcement"}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface hero-shadow"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full border border-line bg-surface p-1.5 text-fg-muted hover:text-fg"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="max-h-64 w-full object-cover" />
        )}
        <div className="p-6">
          {title && <h2 className="pr-8 text-[20px] font-semibold tracking-tight text-fg">{title}</h2>}
          {text && <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-fg-muted">{text}</p>}
          {buttonLabel && buttonHref && (
            external ? (
              <a href={buttonHref} target="_blank" rel="noopener noreferrer" className={buttonClass}>
                {buttonLabel}
              </a>
            ) : (
              <Link href={buttonHref} onClick={() => setOpen(false)} className={buttonClass}>
                {buttonLabel}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
