"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const COLORS: Record<string, string> = {
  blue: "bg-accent-solid text-white",
  dark: "bg-neutral-solid text-white",
  green: "bg-ok-solid text-white",
  amber: "bg-warn-solid text-white",
};

/**
 * The thin bar at the very top of every public page (Website → Announcement
 * bar). It tells the layout how tall it is through the --announce-h CSS
 * variable so the menu and the page start right below it.
 */
export default function AnnouncementBar({
  text,
  linkLabel,
  linkHref,
  color,
}: {
  text: string;
  linkLabel: string;
  linkHref: string;
  color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>("[data-announce-root]");
    if (!root) return;
    if (closed || !ref.current) {
      root.style.setProperty("--announce-h", "0px");
      return;
    }
    const el = ref.current;
    const update = () => root.style.setProperty("--announce-h", `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [closed]);

  if (closed) return null;
  const external = /^https?:\/\//i.test(linkHref);

  return (
    <div ref={ref} role="region" aria-label="Announcement" className={`fixed inset-x-0 top-0 z-50 ${COLORS[color] ?? COLORS.blue}`}>
      <div className="mx-auto flex min-h-10 max-w-6xl items-center justify-center gap-3 px-10 py-2 text-center text-[13.5px] font-medium">
        <span>{text}</span>
        {linkLabel && linkHref && (
          external ? (
            <a href={linkHref} target="_blank" rel="noopener noreferrer" className="shrink-0 underline underline-offset-2">
              {linkLabel}
            </a>
          ) : (
            <Link href={linkHref} className="shrink-0 underline underline-offset-2">
              {linkLabel}
            </Link>
          )
        )}
      </div>
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label="Close announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 opacity-80 hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
