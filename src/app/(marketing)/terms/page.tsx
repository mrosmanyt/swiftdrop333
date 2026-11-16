import type { Metadata } from "next";
import Link from "next/link";
import { getContent, visible } from "@/lib/cms/content";

export const metadata: Metadata = {
  title: "Terms of Service — SwiftDrop",
  description: "The terms that apply when you use SwiftDrop to send or deliver parcels.",
};

/**
 * Terms of Service. The text is edited in the admin console (Website →
 * Terms of Service). It was written for SwiftDrop as a starting point —
 * have a Canadian lawyer review it before relying on it.
 */
export default async function TermsPage() {
  const [c, site] = await Promise.all([getContent("terms"), getContent("site")]);
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-16 sm:px-8">
      {c.updated && <p className="text-[12px] font-semibold uppercase tracking-wider text-accent">Last updated: {c.updated}</p>}
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{c.title}</h1>
      <p className="mt-3 text-fg-muted">{c.intro}</p>
      <div className="mt-10 space-y-10">
        {visible(c.sections).map((s, i) => (
          <section key={`${s.h}-${i}`}>
            <h2 className="text-xl font-semibold">{s.h}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-fg-muted">
              {s.p.map((t, j) => (
                <p key={j}>{t}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-12 rounded-2xl border border-line bg-surface p-5 text-[14.5px] text-fg-muted">
        Need help?{" "}
        {site.email ? (
          <>
            Email{" "}
            <a href={`mailto:${site.email}`} className="text-accent hover:underline">
              {site.email}
            </a>{" "}
            or use our{" "}
          </>
        ) : (
          <>Use our </>
        )}
        <Link href="/contact" className="text-accent hover:underline">
          contact page
        </Link>
        .
      </p>
    </div>
  );
}
