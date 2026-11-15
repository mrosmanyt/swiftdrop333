import type { Metadata } from "next";
import { listActiveZones } from "@/lib/repo";
import Reveal from "@/components/marketing/Reveal";
import { Eyebrow, SectionHeading, PrimaryButton, SecondaryButton, Card } from "@/components/marketing/ui";
import { getContent } from "@/lib/cms/content";
import { pageMetadata } from "@/lib/cms/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("pricing");

/**
 * The zone table reads live rates (including any active surge) straight
 * from the database, so this page must not be frozen at build time —
 * otherwise it would advertise stale prices.
 */
export const dynamic = "force-dynamic";

// Mirrors SERVICE_TYPE_MULTIPLIER in src/lib/pricing.ts so the marketing
// page can't drift from what the engine actually charges.
// The wording for each card comes from the website editor (Website → Pricing
// page), matched by position. The multipliers are NOT editable there on purpose.
const SERVICE_RATES = [
  { id: "BATCH", multiplier: 0.7 },
  { id: "NEXT_DAY", multiplier: 0.85 },
  { id: "SAME_DAY", multiplier: 1, featured: true },
  { id: "DIRECT", multiplier: 1.6 },
];

export default async function PricingPage() {
  const [zones, c] = await Promise.all([listActiveZones(), getContent("pricing")]);
  const SERVICES = SERVICE_RATES.map((rate, i) => ({ ...rate, ...c.services[i] }));
  // 3 km is a representative city hop — used only to illustrate the rate.
  const sampleDistanceKm = 3;

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid mask-fade-b opacity-50" />
        <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[760px] -translate-x-1/2 opacity-50" />

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-8 sm:pt-24">
          <Reveal>
            <SectionHeading
              eyebrow={<Eyebrow>{c.heroEyebrow}</Eyebrow>}
              title={c.heroTitle}
              subtitle={c.heroSubtitle}
            />
          </Reveal>
        </div>
      </section>

      {/* Service types */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s, i) => (
              <Reveal key={s.id} delay={i * 70}>
                <Card
                  className={`flex h-full flex-col ${
                    s.featured ? "border-accent/40 bg-gradient-to-b from-accent/[0.12] to-transparent" : ""
                  }`}
                >
                  {s.featured && (
                    <span className="absolute right-4 top-4 rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-medium text-accent ring-1 ring-inset ring-accent/30">
                      {c.popularLabel}
                    </span>
                  )}
                  <p className={`whitespace-nowrap text-[12px] uppercase tracking-wider text-fg-subtle ${s.featured ? "pr-24" : ""}`}>
                    {s.tagline}
                  </p>
                  <h3 className="mt-2 text-[22px] font-semibold tracking-tight">{s.name}</h3>
                  <p className="mt-3 text-[26px] font-semibold tracking-tight text-fg">
                    {s.multiplier}
                    <span className="text-[15px] font-normal text-fg-subtle">× base rate</span>
                  </p>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-fg-muted">{s.body}</p>
                  <p className="mt-auto border-t border-line pt-4 text-[12.5px] text-fg-subtle">
                    Best for: {s.best}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Live zone rates from the database */}
      <section className="border-y border-line bg-bg-soft py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              align="left"
              title={c.zonesTitle}
              subtitle={c.zonesSubtitle}
            />
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-10 overflow-hidden rounded-2xl border border-line">
              <table className="w-full text-left">
                <thead className="bg-fg/[0.03] text-[12px] uppercase tracking-wider text-fg-subtle">
                  <tr>
                    <th className="px-5 py-4 font-medium">Zone</th>
                    <th className="px-5 py-4 font-medium">Base rate</th>
                    <th className="px-5 py-4 font-medium">Per km</th>
                    <th className="px-5 py-4 font-medium">Same-day, 3 km</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {zones.map((z) => {
                    const sample =
                      (z!.baseRateCents + z!.perKmCents * sampleDistanceKm) / 100;
                    return (
                      <tr key={z!.id} className="transition-colors hover:bg-fg/[0.02]">
                        <td className="px-5 py-4">
                          <p className="text-[14.5px] font-medium">{z!.name}</p>
                          <p className="text-[12.5px] text-fg-subtle">{z!.city}</p>
                        </td>
                        <td className="px-5 py-4 text-[14px] text-fg/80">
                          ${(z!.baseRateCents / 100).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-[14px] text-fg/80">
                          ${(z!.perKmCents / 100).toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[15px] font-semibold">${sample.toFixed(2)}</span>
                          {z!.surgeMultiplier > 1 && (
                            <span className="ml-2 rounded-full bg-orange-400/15 px-2 py-0.5 text-[11px] text-orange-300">
                              {z!.surgeMultiplier}× surge now
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!zones.length && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-[14px] text-fg-subtle">
                        No zones configured yet — run the seed script to load sample cities.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-5 text-[13px] leading-relaxed text-fg-subtle">
              {c.zonesNote}
            </p>
          </Reveal>
        </div>
      </section>

      {/* What's included */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading title={c.includedTitle} subtitle={c.includedSubtitle} />
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-3xl gap-x-10 gap-y-3 sm:grid-cols-2">
            {c.included.map((item, i) => (
              <Reveal key={`${item}-${i}`} delay={i * 35}>
                <div className="flex items-center gap-3 border-b border-line py-3">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-live" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span className="text-[14px] text-fg/75">{item}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-14 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryButton href="/signup/merchant">{c.ctaPrimaryLabel}</PrimaryButton>
              <SecondaryButton href="/couriers">{c.ctaSecondaryLabel}</SecondaryButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
