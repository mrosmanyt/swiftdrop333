import type { Metadata } from "next";
import { getContent, visible } from "@/lib/cms/content";
import { pageMetadata } from "@/lib/cms/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("privacy");

/**
 * Plain-language privacy notice describing what the code actually does.
 * The text is edited in the admin console (Website → Privacy page). Have it
 * reviewed by a Canadian privacy lawyer before relying on it (PIPEDA;
 * Quebec Law 25 if you serve Quebec).
 */
export default async function PrivacyPage() {
  const c = await getContent("privacy");
  const SECTIONS = visible(c.sections);
  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-3 text-fg-muted">
        {c.intro}
      </p>
      <div className="mt-10 space-y-10">
        {SECTIONS.map((s, i) => (
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
    </main>
  );
}
