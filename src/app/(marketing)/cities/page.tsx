import type { Metadata } from "next";
import Reveal from "@/components/marketing/Reveal";
import { Eyebrow, SectionHeading, PrimaryButton, SecondaryButton, Card } from "@/components/marketing/ui";
import PinMap from "@/components/maps/PinMap";
import { getContent, visible } from "@/lib/cms/content";
import { SERVICE_CITIES } from "@/lib/site/canada";

export const metadata: Metadata = {
  title: "Cities — where SwiftDrop delivers in Canada",
  description: "Local delivery in Calgary, Edmonton, Hamilton, Oshawa, Ottawa, Toronto, Vancouver and Winnipeg.",
};

/** Wording: admin console → Website → Cities page. Map positions: src/lib/site/canada.ts. */
export default async function CitiesPage() {
  const c = await getContent("cities");
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid mask-fade-b opacity-50" />
        <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[440px] w-[780px] -translate-x-1/2 opacity-50" />
        <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-20 sm:px-8 sm:pt-24">
          <Reveal>
            <SectionHeading eyebrow={<Eyebrow>{c.eyebrow}</Eyebrow>} title={c.title} subtitle={c.subtitle} />
          </Reveal>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <div className="card-shadow rounded-2xl border border-line bg-surface p-3">
              <PinMap point={null} dots={SERVICE_CITIES.map((s) => ({ lat: s.lat, lng: s.lng, label: s.name }))} className="h-[340px] sm:h-[440px]" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {visible(c.items).map((city, i) => (
            <Reveal key={`${city.name}-${i}`} delay={(i % 4) * 60}>
              <Card className="h-full">
                <p className="text-[12px] uppercase tracking-wider text-fg-subtle">{city.province}</p>
                <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight">{city.name}</h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-fg-muted">{city.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-2xl px-5 text-center sm:px-8">
          {c.note && <p className="text-[14.5px] leading-relaxed text-fg-muted">{c.note}</p>}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryButton href="/zones">{c.ctaLabel}</PrimaryButton>
            <SecondaryButton href="/contact">Ask about your city</SecondaryButton>
          </div>
        </div>
      </section>
    </>
  );
}
