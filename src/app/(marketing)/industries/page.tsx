import type { Metadata } from "next";
import Reveal from "@/components/marketing/Reveal";
import { Eyebrow, SectionHeading, PrimaryButton, SecondaryButton, Card, Icon } from "@/components/marketing/ui";
import { iconPath } from "@/components/marketing/icons";
import { getContent, visible } from "@/lib/cms/content";

export const metadata: Metadata = {
  title: "Industries — local delivery for Canadian shops | SwiftDrop",
  description: "Grocery, bakery, meal prep, florist, retail, pet, alcohol, pharmacy and more — delivered locally with live tracking.",
};

/** Wording: admin console → Website → Industries page. */
export default async function IndustriesPage() {
  const c = await getContent("industries");
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid mask-fade-b opacity-50" />
        <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[440px] w-[780px] -translate-x-1/2 opacity-50" />
        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-20 sm:px-8 sm:pt-24">
          <Reveal>
            <SectionHeading eyebrow={<Eyebrow>{c.eyebrow}</Eyebrow>} title={c.title} subtitle={c.subtitle} />
          </Reveal>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
          {visible(c.items).map((it, i) => (
            <Reveal key={`${it.name}-${i}`} delay={(i % 3) * 70}>
              <Card className="flex h-full flex-col">
                <Icon path={iconPath(it.icon)} />
                <h2 className="text-[18px] font-semibold tracking-tight">{it.name}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">{it.body}</p>
                {it.note && (
                  <p className="mt-auto pt-4">
                    <span className="inline-block rounded-full bg-warn-soft px-2.5 py-1 text-[11.5px] font-medium text-warn">{it.note}</span>
                  </p>
                )}
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-20">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <Reveal>
            <h2 className="text-balance text-[28px] font-semibold tracking-tightest text-gradient sm:text-[36px]">{c.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-lg text-[15.5px] leading-relaxed text-fg-muted">{c.ctaText}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryButton href="/contact">{c.ctaLabel}</PrimaryButton>
              <SecondaryButton href="/signup/merchant">Create a business account</SecondaryButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
