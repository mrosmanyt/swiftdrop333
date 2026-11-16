import Link from "next/link";
import type { Metadata } from "next";
import TrackingPreview from "@/components/marketing/TrackingPreview";
import ScreenShot from "@/components/marketing/ScreenShot";
import Reveal from "@/components/marketing/Reveal";
import FAQ from "@/components/marketing/FAQ";
import { Eyebrow, SectionHeading, PrimaryButton, SecondaryButton, Card, Icon } from "@/components/marketing/ui";
import { iconPath } from "@/components/marketing/icons";
import { getContent, safeHref, visible } from "@/lib/cms/content";
import { pageMetadata } from "@/lib/cms/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("home");

/**
 * All wording on this page comes from the website editor (admin console →
 * Website → Homepage). Until something is published there, getContent()
 * returns the original text from src/lib/cms/defaults.ts.
 */
export default async function HomePage() {
  const [c, faq, reviewsContent] = await Promise.all([getContent("home"), getContent("faq"), getContent("reviews")]);
  // Real customer reviews, added in the admin console. Hidden until there is at least one.
  const reviews = visible(reviewsContent.items).filter((r) => r.quote.trim());
  const CITIES = c.cities;
  // Small feature cards are laid out three to a row on a six-column grid.
  const featCards = visible(c.featCards);
  return (
    <>
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid mask-fade-b opacity-60" />
        <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 opacity-60" />

        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <div>
              <Reveal>
                <Eyebrow>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-live animate-pulse-ring" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
                  </span>
                  {c.heroBadge}
                </Eyebrow>
              </Reveal>

              <Reveal delay={60}>
                <h1 className="mt-6 text-balance text-[40px] font-semibold leading-[1.05] tracking-tightest sm:text-[54px] md:text-[62px]">
                  <span className="text-gradient">{c.heroLine1}</span>
                  <br />
                  <span className="text-gradient-accent">{c.heroLine2}</span>
                </h1>
              </Reveal>

              <Reveal delay={120}>
                <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-fg-muted sm:text-[17px]">
                  {c.heroText}
                </p>
              </Reveal>

              <Reveal delay={180}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton href={safeHref(c.heroPrimaryHref) || "/signup/merchant"}>
                    {c.heroPrimaryLabel}
                    <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </PrimaryButton>
                  <SecondaryButton href={safeHref(c.heroSecondaryHref) || "/couriers"}>{c.heroSecondaryLabel}</SecondaryButton>
                </div>
              </Reveal>

              <Reveal delay={240}>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-fg-subtle">
                  {c.heroChecks.map((text, i) => (
                    <span key={`${text}-${i}`} className="flex items-center gap-2">
                      <Check /> {text}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={200}>
              <div className="animate-float">
                <TrackingPreview />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Stats ───────────────────────── */}
      <section className="relative border-y border-line bg-bg-soft">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 sm:px-8 md:grid-cols-4">
          {visible(c.stats).map((s, i) => (
            <Reveal key={`${s.label}-${i}`} delay={i * 70}>
              <div className="px-2 py-8 text-center md:py-10">
                <p className="text-[28px] font-semibold tracking-tight text-fg md:text-[34px]">
                  {s.value}
                </p>
                <p className="mt-1 text-[12.5px] text-fg-subtle">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────────────── How it works ───────────────────────── */}
      <section id="how" className="relative scroll-mt-20 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow={<Eyebrow>{c.howEyebrow}</Eyebrow>}
              title={c.howTitle}
              subtitle={c.howSubtitle}
            />
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {visible(c.steps).map((step, i) => (
              <Reveal key={`${step.n}-${i}`} delay={i * 90}>
                <Card className="h-full">
                  <span className="text-[13px] font-medium tracking-widest text-accent/70">
                    {step.n}
                  </span>
                  <h3 className="mt-3 text-[18px] font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-fg-muted">{step.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Features (bento) ───────────────────────── */}
      <section id="features" className="relative scroll-mt-20 pb-24 sm:pb-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow={<Eyebrow>{c.featEyebrow}</Eyebrow>}
              title={c.featTitle}
              subtitle={c.featSubtitle}
            />
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            {/* Wide: live tracking */}
            <Reveal className="md:col-span-4">
              <Card className="h-full">
                <Icon path={<><path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11Z" /><circle cx="12" cy="10" r="2.6" /></>} />
                <h3 className="text-[18px] font-semibold tracking-tight">{c.featWideTitle}</h3>
                <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-fg-muted">
                  {c.featWideBody}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2 text-[12px] text-fg-subtle">
                  <span className="rounded-md border border-line bg-fg/5 px-2 py-1">Your customer</span>
                  <span className="rounded-md border border-line bg-fg/5 px-2 py-1">Your team</span>
                  <span className="text-fg-subtle">see the same live map, at the same time</span>
                </div>
              </Card>
            </Reveal>

            {/* Tall: pricing */}
            <Reveal delay={80} className="md:col-span-2">
              <Card className="h-full">
                <Icon path={<><path d="M12 2v20" /><path d="M17 6.5c0-2-2.2-3-5-3s-5 .9-5 3 2.2 2.8 5 3.3 5 1.2 5 3.4-2.2 3.3-5 3.3-5-1.2-5-3.3" /></>} />
                <h3 className="text-[18px] font-semibold tracking-tight">{c.featTallTitle}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-fg-muted">
                  {c.featTallBody}
                </p>
                <Link href="/pricing" className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] text-accent hover:underline">
                  {c.featTallLinkLabel}
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              </Card>
            </Reveal>

            {featCards.map((f, i) => (
              <Reveal key={`${f.title}-${i}`} delay={120 + i * 70} className="md:col-span-2">
                <Card className="h-full">
                  <Icon path={iconPath(f.icon)} />
                  <h3 className="text-[17px] font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-muted">{f.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Product shot ───────────────────────── */}
      <section className="pb-24 sm:pb-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow={<Eyebrow>{c.shotEyebrow}</Eyebrow>}
              title={c.shotTitle}
              subtitle={c.shotSubtitle}
            />
          </Reveal>
          <Reveal delay={90}>
            <div className="mt-12">
              <ScreenShot
                src="/screenshots/merchant-dashboard.png"
                alt="The SwiftDrop merchant dashboard listing recent deliveries with status, service type and price"
                label="app.swiftdrop.ca/merchant/dashboard"
              />
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-8 flex justify-center">
              <SecondaryButton href="/features">
                {c.shotButtonLabel}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </SecondaryButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── Coverage ───────────────────────── */}
      <section id="coverage" className="relative scroll-mt-20 border-y border-line bg-bg-soft py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <p className="text-center text-[12.5px] uppercase tracking-[0.2em] text-fg-subtle">
              {c.coverageTitle}
            </p>
          </Reveal>
          <div className="mask-fade-x mt-8 overflow-hidden">
            <div className="flex w-max animate-marquee gap-3">
              {[...CITIES, ...CITIES].map((city, i) => (
                <span
                  key={`${city}-${i}`}
                  className="whitespace-nowrap rounded-xl border border-line bg-fg/[0.03] px-5 py-2.5 text-[14px] text-fg-muted"
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Courier strip ───────────────────────── */}
      <section className="relative py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-fg/[0.06] to-transparent p-8 sm:p-12">
            <div className="glow pointer-events-none absolute -right-20 -top-24 h-[380px] w-[380px] opacity-50" />
            <div className="relative grid items-center gap-10 md:grid-cols-2">
              <div>
                <Eyebrow>{c.courierEyebrow}</Eyebrow>
                <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tightest text-gradient sm:text-[38px] sm:leading-[1.12]">
                  {c.courierTitle}
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fg-muted">
                  {c.courierText}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton href="/signup/courier">{c.courierPrimaryLabel}</PrimaryButton>
                  <SecondaryButton href="/couriers">{c.courierSecondaryLabel}</SecondaryButton>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {visible(c.courierStats).map((s, i) => (
                  <Reveal key={`${s.value}-${i}`} delay={i * 70}>
                    <div className="rounded-2xl border border-line bg-surface-2 p-5">
                      <p className="text-[24px] font-semibold tracking-tight">{s.value}</p>
                      <p className="mt-1 text-[12.5px] leading-snug text-fg-subtle">{s.label}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Reviews (only when some have been added) ───────────────────────── */}
      {reviews.length > 0 && (
        <section className="border-t border-line pb-24 pt-20 sm:pb-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <SectionHeading title={reviewsContent.title} subtitle={reviewsContent.subtitle || undefined} />
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, i) => (
                <Reveal key={`${r.business}-${i}`} delay={(i % 3) * 70}>
                  <Card className="flex h-full flex-col">
                    {r.industry && (
                      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-accent">{r.industry}</p>
                    )}
                    <blockquote className="mt-3 text-[14.5px] leading-relaxed text-fg/85">“{r.quote}”</blockquote>
                    <p className="mt-auto pt-5 text-[13.5px]">
                      <span className="font-semibold text-fg">{r.business}</span>
                      {r.name && <span className="text-fg-subtle"> · {r.name}</span>}
                    </p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────── FAQ ───────────────────────── */}
      <section className="pb-24 sm:pb-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading eyebrow={<Eyebrow>{c.faqEyebrow}</Eyebrow>} title={c.faqTitle} />
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-12">
              <FAQ items={visible(faq.items)} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── Final CTA ───────────────────────── */}
      <section className="relative overflow-hidden border-t border-line py-24 sm:py-28">
        <div className="glow pointer-events-none absolute bottom-[-220px] left-1/2 h-[500px] w-[820px] -translate-x-1/2 opacity-60" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <Reveal>
            <h2 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-tightest text-gradient sm:text-[46px]">
              {c.ctaTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-fg-muted">
              {c.ctaText}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryButton href={safeHref(c.ctaPrimaryHref) || "/signup/merchant"}>{c.ctaPrimaryLabel}</PrimaryButton>
              <SecondaryButton href={safeHref(c.ctaSecondaryHref) || "/pricing"}>{c.ctaSecondaryLabel}</SecondaryButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-live" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
