import Link from "next/link";
import type { Metadata } from "next";
import TrackingPreview from "@/components/marketing/TrackingPreview";
import ScreenShot from "@/components/marketing/ScreenShot";
import SitePhoto, { CardPhoto, hasPhoto } from "@/components/marketing/SitePhoto";
import type { SiteImageKey } from "@/lib/site/images";

/** Photos for the three "How it works" steps, in order. */
const STEP_PHOTOS: SiteImageKey[] = ["stepBook", "stepDispatch", "stepWatch"];
/** Photos for the small feature cards, matched by the card's icon. */
const FEAT_PHOTOS: Record<string, SiteImageKey> = { batch: "featBatch", camera: "featProof", code: "featApi" };
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
  const heroPhoto = hasPhoto("homeHero");
  const courierPhoto = hasPhoto("courier");
  const trackingPhoto = hasPhoto("tracking");
  const coveragePhoto = hasPhoto("coverage");
  return (
    <>
      {/* ───────────────────────── Hero ───────────────────────── */}
      {/* One deep panel carries the whole first screen. With a photograph
          (src/lib/site/images.ts) it becomes the background; without one the
          live-tracking card stands in. */}
      <section className="px-3 pt-2 sm:px-5">
        <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-panel text-panel-fg">
          <SitePhoto name="homeHero" alt="" priority sizes="(min-width: 1400px) 1400px, 100vw" />
          {heroPhoto && (
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-[rgb(6_32_25/0.92)] via-[rgb(6_32_25/0.62)] to-[rgb(6_32_25/0.08)]"
            />
          )}

          <div
            className={`relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:min-h-[640px] ${
              heroPhoto ? "" : "lg:grid-cols-[1.1fr_0.9fr]"
            }`}
          >
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2.5 text-[14px] font-medium text-panel-muted">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-sun animate-pulse-ring" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sun" />
                </span>
                {c.heroBadge}
              </p>

              <h1 className="font-display mt-6 text-balance text-[46px] leading-[0.98] sm:text-[68px] lg:text-[84px]">
                {c.heroLine1}
                <br />
                {c.heroLine2}
              </h1>

              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-panel-fg/85 sm:text-[18.5px]">
                {c.heroText}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton href={safeHref(c.heroPrimaryHref) || "/signup/merchant"}>
                  {c.heroPrimaryLabel}
                </PrimaryButton>
                <SecondaryButton
                  href={safeHref(c.heroSecondaryHref) || "/couriers"}
                  className="border-panel-fg/35 text-panel-fg hover:border-panel-fg/70 hover:bg-panel-fg/10"
                >
                  {c.heroSecondaryLabel}
                </SecondaryButton>
              </div>

              <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-2 text-[14px] text-panel-muted">
                {c.heroChecks.map((text, i) => (
                  <li key={`${text}-${i}`} className="flex items-center gap-2">
                    <Check /> {text}
                  </li>
                ))}
              </ul>
            </div>

            {!heroPhoto && (
              <div className="hidden lg:block">
                <TrackingPreview />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Stats ───────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <dl className="grid grid-cols-2 border-b border-line md:grid-cols-4">
          {visible(c.stats).map((s, i) => (
            <div key={`${s.label}-${i}`} className="border-line py-9 pr-4 md:border-l md:pl-7 md:first:border-l-0 md:first:pl-0">
              <dd className="font-display text-[40px] leading-none text-fg md:text-[52px]">{s.value}</dd>
              <dt className="mt-2 text-[14px] text-fg-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ───────────────────────── How it works ───────────────────────── */}
      <section id="how" className="relative scroll-mt-20 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow={<Eyebrow>{c.howEyebrow}</Eyebrow>}
              title={c.howTitle}
              subtitle={c.howSubtitle}
            />
          </Reveal>

          {/* A real sequence, so it is numbered. */}
          <ol className="mt-14 grid gap-x-10 gap-y-10 md:grid-cols-3">
            {visible(c.steps).map((step, i) => (
              <li key={`${step.n}-${i}`} className="flex flex-col">
                {STEP_PHOTOS[i] && hasPhoto(STEP_PHOTOS[i]) && (
                  <Reveal delay={i * 80}>
                    <div className="relative mb-7 aspect-[4/3] overflow-hidden rounded-[20px] bg-bg-soft">
                      <SitePhoto name={STEP_PHOTOS[i]} alt="" sizes="(min-width: 768px) 33vw, 100vw" />
                    </div>
                  </Reveal>
                )}
                <div className="border-t-2 border-fg pt-6">
                  <span className="font-display text-[44px] leading-none text-accent">{step.n}</span>
                  <h3 className="mt-4 text-[20px] font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2.5 text-[15.5px] leading-relaxed text-fg-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────────────────── Features (bento) ───────────────────────── */}
      <section id="features" className="relative scroll-mt-20 pb-24 sm:pb-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow={<Eyebrow>{c.featEyebrow}</Eyebrow>}
              title={c.featTitle}
              subtitle={c.featSubtitle}
            />
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            {/* Wide: live tracking */}
            <Reveal className="md:col-span-4">
              <Card className={`h-full ${trackingPhoto ? "grid gap-6 !p-0 sm:grid-cols-2" : ""}`}>
                <div className={trackingPhoto ? "p-6 sm:p-7" : ""}>
                  <Icon path={<><path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11Z" /><circle cx="12" cy="10" r="2.6" /></>} />
                  <h3 className="text-[20px] font-semibold tracking-tight">{c.featWideTitle}</h3>
                  <p className="mt-2.5 max-w-lg text-[15px] leading-relaxed text-fg-muted">
                    {c.featWideBody}
                  </p>
                  <p className="mt-6 text-[14px] text-fg-muted">
                    Your customer and your team see the same live map, at the same time.
                  </p>
                </div>
                {trackingPhoto && (
                  <div className="relative min-h-[240px]">
                    <SitePhoto name="tracking" alt="" sizes="(min-width: 768px) 30vw, 100vw" />
                  </div>
                )}
              </Card>
            </Reveal>

            {/* Tall: pricing */}
            <Reveal delay={80} className="md:col-span-2">
              <Card className="h-full">
                <CardPhoto name="pricingCard" aspect="aspect-[4/3]" sizes="(min-width: 768px) 33vw, 100vw" />
                <Icon path={<><path d="M12 2v20" /><path d="M17 6.5c0-2-2.2-3-5-3s-5 .9-5 3 2.2 2.8 5 3.3 5 1.2 5 3.4-2.2 3.3-5 3.3-5-1.2-5-3.3" /></>} />
                <h3 className="text-[20px] font-semibold tracking-tight">{c.featTallTitle}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-fg-muted">
                  {c.featTallBody}
                </p>
                <Link href="/pricing" className="mt-5 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-accent underline-offset-4 hover:underline">
                  {c.featTallLinkLabel}
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              </Card>
            </Reveal>

            {featCards.map((f, i) => (
              <Reveal key={`${f.title}-${i}`} delay={120 + i * 70} className="md:col-span-2">
                <Card className="h-full">
                  <CardPhoto name={FEAT_PHOTOS[f.icon]} />
                  <Icon path={iconPath(f.icon)} />
                  <h3 className="text-[18px] font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-relaxed text-fg-muted">{f.body}</p>
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
      {/* With a photograph (src/lib/site/images.ts → coverage) the band becomes
          a skyline panel; without one it is the plain tinted strip. */}
      <section
        id="coverage"
        className={`relative scroll-mt-20 ${coveragePhoto ? "px-3 sm:px-5" : "border-y border-line bg-bg-soft py-16"}`}
      >
        <div
          className={
            coveragePhoto
              ? "relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-panel py-24 text-panel-fg sm:py-32"
              : ""
          }
        >
          <SitePhoto name="coverage" alt="" sizes="(min-width: 1400px) 1400px, 100vw" />
          {coveragePhoto && (
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[rgb(6_32_25/0.55)] via-[rgb(6_32_25/0.35)] to-[rgb(6_32_25/0.85)]" />
          )}
          <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <p
                className={
                  coveragePhoto
                    ? "font-display text-balance text-center text-[34px] leading-[1.05] sm:text-[48px]"
                    : "text-center text-[15px] font-semibold text-fg"
                }
              >
                {c.coverageTitle}
              </p>
            </Reveal>
            <div className={`mask-fade-x overflow-hidden ${coveragePhoto ? "mt-10" : "mt-8"}`}>
              <div className="flex w-max animate-marquee gap-3">
                {[...CITIES, ...CITIES].map((city, i) => (
                  <span
                    key={`${city}-${i}`}
                    className={`whitespace-nowrap rounded-full px-5 py-2.5 text-[14.5px] ${
                      coveragePhoto
                        ? "border border-white/25 bg-white/10 text-white backdrop-blur-md"
                        : "border border-line bg-surface text-fg"
                    }`}
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Courier strip ───────────────────────── */}
      <section className="relative py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-stretch gap-6 md:grid-cols-2">
            <div className="flex flex-col justify-center rounded-[24px] border border-line bg-surface p-8 sm:p-12">
              <Eyebrow>{c.courierEyebrow}</Eyebrow>
              <h2 className="font-display mt-4 text-balance text-[34px] leading-[1.02] text-fg sm:text-[46px]">
                {c.courierTitle}
              </h2>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-fg-muted">{c.courierText}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton href="/signup/courier">{c.courierPrimaryLabel}</PrimaryButton>
                <SecondaryButton href="/couriers">{c.courierSecondaryLabel}</SecondaryButton>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[24px] bg-panel text-panel-fg">
              <SitePhoto name="courier" alt="" sizes="(min-width: 768px) 50vw, 100vw" />
              {courierPhoto && (
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[rgb(6_32_25/0.95)] via-[rgb(6_32_25/0.5)] to-transparent" />
              )}
              <dl
                className={`relative grid h-full grid-cols-2 gap-px ${
                  courierPhoto ? "content-end p-6 sm:p-8 md:min-h-[460px]" : "p-8 sm:p-12"
                }`}
              >
                {visible(c.courierStats).map((s, i) => (
                  <div key={`${s.value}-${i}`} className="py-4 pr-4">
                    <dd className="font-display text-[34px] leading-none text-sun sm:text-[42px]">{s.value}</dd>
                    <dt className="mt-2 text-[14px] leading-snug text-panel-fg/80">{s.label}</dt>
                  </div>
                ))}
              </dl>
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
                      <p className="text-[13px] font-semibold text-accent">{r.industry}</p>
                    )}
                    <blockquote className="mt-3 text-[16px] leading-relaxed text-fg">“{r.quote}”</blockquote>
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
      <section className="px-3 pb-3 sm:px-5 sm:pb-5">
        <div className="mx-auto max-w-[1400px] rounded-[28px] bg-panel px-6 py-20 text-center text-panel-fg sm:py-28">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-balance text-[40px] leading-[1] sm:text-[64px]">{c.ctaTitle}</h2>
            <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-panel-fg/80">{c.ctaText}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryButton href={safeHref(c.ctaPrimaryHref) || "/signup/merchant"}>{c.ctaPrimaryLabel}</PrimaryButton>
              <SecondaryButton
                href={safeHref(c.ctaSecondaryHref) || "/pricing"}
                className="border-panel-fg/35 text-panel-fg hover:border-panel-fg/70 hover:bg-panel-fg/10"
              >
                {c.ctaSecondaryLabel}
              </SecondaryButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-sun" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
