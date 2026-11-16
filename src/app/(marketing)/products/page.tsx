import type { Metadata } from "next";
import Reveal from "@/components/marketing/Reveal";
import { Eyebrow, SectionHeading, PrimaryButton, SecondaryButton, Card, Icon } from "@/components/marketing/ui";
import { iconPath } from "@/components/marketing/icons";
import { getContent, visible } from "@/lib/cms/content";

export const metadata: Metadata = {
  title: "Products — Next Day, Same Day, Direct and Batch delivery | SwiftDrop",
  description: "Four delivery services for Canadian businesses. Choose the speed and price that suits each parcel.",
};

/** Wording: admin console → Website → Products page. */
export default async function ProductsPage() {
  const c = await getContent("products");
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
        <div className="mx-auto grid max-w-6xl gap-4 px-5 sm:px-8 md:grid-cols-2">
          {visible(c.items).map((p, i) => (
            <Reveal key={`${p.name}-${i}`} delay={(i % 2) * 80}>
              <Card className="flex h-full flex-col">
                <Icon path={iconPath(p.icon)} />
                <h2 className="text-[22px] font-semibold tracking-tight">{p.name}</h2>
                <p className="mt-1 text-[14px] font-medium text-accent">{p.tagline}</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-fg-muted">{p.body}</p>
                <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                  {p.points.map((pt, j) => (
                    <li key={`${pt}-${j}`} className="flex items-start gap-3 text-[14px] text-fg/80">
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-live" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {pt}
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-bg-soft py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading title={c.includedTitle} align="left" />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible(c.included).map((f, i) => (
              <Reveal key={`${f.title}-${i}`} delay={i * 60}>
                <Card className="h-full">
                  <Icon path={iconPath(f.icon)} />
                  <h3 className="text-[16px] font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-fg-muted">{f.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 sm:py-24">
        <div className="glow pointer-events-none absolute bottom-[-220px] left-1/2 h-[460px] w-[760px] -translate-x-1/2 opacity-55" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <Reveal>
            <h2 className="text-balance text-[30px] font-semibold leading-[1.1] tracking-tightest text-gradient sm:text-[40px]">{c.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-lg text-[15.5px] leading-relaxed text-fg-muted">{c.ctaText}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryButton href="/signup/merchant">{c.ctaLabel}</PrimaryButton>
              <SecondaryButton href="/zones">Check prices for your address</SecondaryButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
