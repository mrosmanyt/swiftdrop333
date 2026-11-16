import type { Metadata } from "next";
import Reveal from "@/components/marketing/Reveal";
import SitePhoto, { hasPhoto } from "@/components/marketing/SitePhoto";
import type { SiteImageKey } from "@/lib/site/images";
import { Eyebrow, SectionHeading, PrimaryButton, SecondaryButton, Card } from "@/components/marketing/ui";
import { getContent, visible } from "@/lib/cms/content";

export const metadata: Metadata = {
  title: "How SwiftDrop works — from sign-up to your first delivery",
  description: "Create an account, get verified, book a delivery, label it, and we pick up and deliver with live tracking.",
};

/** Photo for each step, in step order. */
const STEP_PHOTOS: SiteImageKey[] = ["howSignup", "howApproved", "howBook", "howLabel", "howDeliver"];

/** Wording: admin console → Website → How it works page. */
export default async function HowItWorksPage() {
  const c = await getContent("howItWorks");
  const steps = visible(c.steps);
  const anyPhoto = STEP_PHOTOS.some((k) => hasPhoto(k));
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

      <section className="pb-20">
        <ol className={`mx-auto px-5 sm:px-8 ${anyPhoto ? "max-w-5xl space-y-6 sm:space-y-10" : "max-w-3xl space-y-4"}`}>
          {steps.map((s, i) => {
            const photo = STEP_PHOTOS[i] && hasPhoto(STEP_PHOTOS[i]) ? STEP_PHOTOS[i] : undefined;
            return (
              <li key={`${s.title}-${i}`}>
                <Reveal delay={anyPhoto ? 0 : i * 60}>
                  <div className={photo ? "grid items-center gap-6 md:grid-cols-2 md:gap-10" : ""}>
                    {photo && (
                      <div className={`relative aspect-[16/10] overflow-hidden rounded-[20px] bg-bg-soft ${i % 2 === 1 ? "md:order-2" : ""}`}>
                        <SitePhoto name={photo} alt="" sizes="(min-width: 768px) 50vw, 100vw" />
                      </div>
                    )}
                    <Card className="flex gap-5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-solid text-[15px] font-semibold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-[12px] uppercase tracking-wider text-fg-subtle">Step {i + 1}</p>
                        <h2 className="mt-1 text-[18px] font-semibold tracking-tight">{s.title}</h2>
                        <p className="mt-1.5 text-[14.5px] leading-relaxed text-fg-muted">{s.body}</p>
                      </div>
                    </Card>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-y border-line bg-bg-soft py-20">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 sm:px-8 md:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="text-[24px] font-semibold tracking-tight">{c.trackingTitle}</h2>
              <dl className="mt-6 space-y-5">
                {visible(c.tracking).map((t, i) => (
                  <div key={`${t.title}-${i}`}>
                    <dt className="text-[15px] font-semibold text-fg">{t.title}</dt>
                    <dd className="mt-1 text-[14.5px] leading-relaxed text-fg-muted">{t.body}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="card-shadow rounded-2xl border border-line bg-surface p-6">
              <h2 className="text-[20px] font-semibold tracking-tight">{c.crucialTitle}</h2>
              <dl className="mt-5 space-y-5">
                {visible(c.crucial).map((t, i) => (
                  <div key={`${t.title}-${i}`}>
                    <dt className="text-[14.5px] font-semibold text-fg">{t.title}</dt>
                    <dd className="mt-1 text-[14px] leading-relaxed text-fg-muted">{t.body}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <Reveal>
            <h2 className="text-balance text-[28px] font-semibold tracking-tightest text-gradient sm:text-[36px]">{c.ctaTitle}</h2>
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
