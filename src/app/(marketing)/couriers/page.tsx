import type { Metadata } from "next";
import Reveal from "@/components/marketing/Reveal";
import { Eyebrow, SectionHeading, PrimaryButton, SecondaryButton, Card, Icon } from "@/components/marketing/ui";
import { iconPath } from "@/components/marketing/icons";
import { getContent, visible } from "@/lib/cms/content";
import { pageMetadata } from "@/lib/cms/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("couriers");

/** Wording comes from the website editor (Website → Drive with us page). */
export default async function CouriersPage() {
  const c = await getContent("couriers");
  const TIERS = visible(c.tiers);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid mask-fade-b opacity-50" />
        <div className="glow pointer-events-none absolute -top-32 left-1/4 h-[440px] w-[720px] opacity-50" />

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-8 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Reveal>
                <Eyebrow>{c.heroEyebrow}</Eyebrow>
              </Reveal>
              <Reveal delay={60}>
                <h1 className="mt-6 text-balance text-[38px] font-semibold leading-[1.06] tracking-tightest sm:text-[52px]">
                  <span className="text-gradient">{c.heroLine1}</span>
                  <br />
                  <span className="text-gradient-accent">{c.heroLine2}</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-fg-muted">
                  {c.heroText}
                </p>
              </Reveal>
              <Reveal delay={180}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton href="/signup/courier">{c.heroPrimaryLabel}</PrimaryButton>
                  <SecondaryButton href="#tiers">{c.heroSecondaryLabel}</SecondaryButton>
                </div>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-6 text-[13px] text-fg-subtle">
                  {c.heroNote}
                </p>
              </Reveal>
            </div>

            {/* Offer card mock */}
            <Reveal delay={200}>
              <div className="animate-float">
                <div className="glass rounded-2xl p-5 hero-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium text-accent ring-1 ring-inset ring-accent/25">
                        Offered to you
                      </span>
                      <p className="mt-3 text-[15px] font-medium">Downtown Core</p>
                      <p className="mt-1 text-[13px] text-fg-muted">
                        123 Queen St W → 456 King St W
                      </p>
                      <p className="mt-1 text-[12px] text-fg-subtle">Same Day · 2.4 km · by 5:00 PM</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[26px] font-semibold tracking-tight text-live">$7.27</p>
                      <p className="text-[11px] text-fg-subtle">38s left</p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <span className="flex-1 rounded-xl bg-inverse py-2.5 text-center text-[13.5px] font-medium text-inverse-fg">
                      Accept
                    </span>
                    <span className="rounded-xl border border-line px-4 py-2.5 text-[13.5px] text-fg-muted">
                      Pass
                    </span>
                  </div>

                  <div className="mt-5 border-t border-line pt-4">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-fg-muted">Gold tier progress</span>
                      <span className="text-fg/80">104 / 120</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fg/10">
                      <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-accent to-live" />
                    </div>
                    <p className="mt-2 text-[11.5px] text-fg-subtle">
                      16 more deliveries this period to reach Gold.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="border-y border-line bg-bg-soft py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {visible(c.why).map((f, i) => (
              <Reveal key={`${f.title}-${i}`} delay={i * 80}>
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

      {/* Tiers */}
      <section id="tiers" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow={<Eyebrow>{c.tiersEyebrow}</Eyebrow>}
              title={c.tiersTitle}
              subtitle={c.tiersSubtitle}
            />
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((t, i) => (
              <Reveal key={`${t.name}-${i}`} delay={i * 70}>
                <Card
                  className={`flex h-full flex-col ${
                    t.featured ? "border-accent/40 bg-gradient-to-b from-accent/[0.12] to-transparent" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-[19px] font-semibold tracking-tight">{t.name}</h3>
                    {t.featured && <span className="text-[16px]">⭐</span>}
                  </div>
                  <p className="mt-3 text-[26px] font-semibold tracking-tight text-live">
                    {t.bonus}
                    {t.bonus !== "—" && (
                      <span className="ml-1 text-[13px] font-normal text-fg-subtle">per delivery</span>
                    )}
                  </p>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-fg-subtle">{t.requirement}</p>
                  <ul className="mt-5 space-y-2 border-t border-line pt-4">
                    {t.perks.map((p, j) => (
                      <li key={`${p}-${j}`} className="flex items-start gap-2 text-[13px] text-fg-muted">
                        <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-live" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="border-t border-line py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading title={c.reqTitle} align="left" />
          </Reveal>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <Reveal>
              <div>
                <p className="text-[13px] uppercase tracking-wider text-fg-subtle">{c.reqEveryoneLabel}</p>
                <ul className="mt-4 space-y-3">
                  {c.reqEveryone.map((r, j) => (
                    <li key={`${r}-${j}`} className="flex items-start gap-3 text-[14px] text-fg/75">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div>
                <p className="text-[13px] uppercase tracking-wider text-fg-subtle">
                  {c.reqVehicleLabel}
                </p>
                <ul className="mt-4 space-y-3">
                  {c.reqVehicle.map((r, j) => (
                    <li key={`${r}-${j}`} className="flex items-start gap-3 text-[14px] text-fg/75">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-live" />
                      {r}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[12.5px] leading-relaxed text-amber-700 dark:text-amber-200/80">
                  {c.reqNote}
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <div className="mt-14 rounded-2xl border border-line bg-gradient-to-br from-fg/[0.06] to-transparent p-8 text-center">
              <h3 className="text-[24px] font-semibold tracking-tight text-gradient sm:text-[28px]">
                {c.applyTitle}
              </h3>
              <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-fg-muted">
                {c.applyText}
              </p>
              <div className="mt-7 flex justify-center">
                <PrimaryButton href="/signup/courier">{c.applyButtonLabel}</PrimaryButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
