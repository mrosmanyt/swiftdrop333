import type { Metadata } from "next";
import Reveal from "@/components/marketing/Reveal";
import { Eyebrow, SectionHeading, PrimaryButton, SecondaryButton, Card, Icon } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Drive with SwiftDrop — Earn on your own schedule",
  description:
    "Deliver by bike, scooter, car or van. Keep 72% of every delivery fee, see the pay before you accept, and cash out weekly for free.",
};

const TIERS = [
  {
    name: "Starter",
    bonus: "—",
    requirement: "Everyone starts here",
    perks: ["Standard offers", "Weekly free cash-out", "In-app support"],
  },
  {
    name: "Silver",
    bonus: "+5¢",
    requirement: "50 deliveries · 95% completion",
    perks: ["Everything in Starter", "Earlier offer visibility"],
  },
  {
    name: "Gold",
    bonus: "+10¢",
    requirement: "120 deliveries · 97% completion · 0 misdeliveries",
    perks: ["Everything in Silver", "Priority on batch routes"],
  },
  {
    name: "Pro",
    bonus: "+20¢",
    requirement: "200 deliveries · 98% completion · no complaints",
    perks: ["Everything in Gold", "First look at every drop", "Priority support line", "Exclusive challenges"],
    featured: true,
  },
];

export default function CouriersPage() {
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
                <Eyebrow>Now onboarding couriers</Eyebrow>
              </Reveal>
              <Reveal delay={60}>
                <h1 className="mt-6 text-balance text-[38px] font-semibold leading-[1.06] tracking-tightest sm:text-[52px]">
                  <span className="text-gradient">Know what you&apos;ll earn</span>
                  <br />
                  <span className="text-gradient-accent">before you accept.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-fg-muted">
                  Every offer shows the exact payout, the distance and the drop-off up front. No
                  mystery fares, no acceptance-rate punishment, no waiting two weeks to get paid.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton href="/signup/courier">Apply to drive</PrimaryButton>
                  <SecondaryButton href="#tiers">See the tiers</SecondaryButton>
                </div>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-6 text-[13px] text-fg-subtle">
                  Bike · Scooter · Car · Van — bike couriers don&apos;t need a licence or vehicle
                  insurance.
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
            {[
              {
                title: "72% of the fee, always",
                body: "We keep 28% to run the platform. Surge raises the whole fare, so when it's snowing your share goes up too — it isn't kept by us.",
                icon: <><path d="M12 2v20" /><path d="M17 6.5c0-2-2.2-3-5-3s-5 .9-5 3 2.2 2.8 5 3.3 5 1.2 5 3.4-2.2 3.3-5 3.3-5-1.2-5-3.3" /></>,
              },
              {
                title: "Cash out when you want",
                body: "Weekly payouts are free. Need it today? Instant cash-out costs 1.5%. Your balance updates the moment a delivery completes.",
                icon: <><rect x="2.5" y="6" width="19" height="13" rx="2.5" /><path d="M2.5 10.5h19" /><path d="M7 15h3" /></>,
              },
              {
                title: "Pay you can actually check",
                body: "Your app shows engaged hours, earnings, bonuses and effective hourly rate for every period — plus exactly how each fare was calculated.",
                icon: <><path d="M9 11.5 11 13.5l4-4.5" /><rect x="3" y="4" width="18" height="17" rx="2.5" /><path d="M8 2v4M16 2v4" /></>,
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <Card className="h-full">
                  <Icon path={f.icon} />
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
              eyebrow={<Eyebrow>Courier+ programme</Eyebrow>
              }
              title="Tiers you can see yourself climbing"
              subtitle="Progress updates live in your app — not revealed at the end of the period when it's too late to do anything about it."
            />
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((t, i) => (
              <Reveal key={t.name} delay={i * 70}>
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
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-[13px] text-fg-muted">
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
            <SectionHeading title="What you need to start" align="left" />
          </Reveal>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <Reveal>
              <div>
                <p className="text-[13px] uppercase tracking-wider text-fg-subtle">Everyone</p>
                <ul className="mt-4 space-y-3">
                  {[
                    "Legally eligible to work in Canada",
                    "A smartphone with location turned on",
                    "Government photo ID",
                    "A way to carry parcels up to 9 kg",
                  ].map((r) => (
                    <li key={r} className="flex items-start gap-3 text-[14px] text-fg/75">
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
                  Car, van or scooter
                </p>
                <ul className="mt-4 space-y-3">
                  {[
                    "Valid driver's licence",
                    "Vehicle registration",
                    "Insurance covering commercial delivery use",
                    "Background check (we run it — takes a day or two)",
                  ].map((r) => (
                    <li key={r} className="flex items-start gap-3 text-[14px] text-fg/75">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-live" />
                      {r}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[12.5px] leading-relaxed text-amber-700 dark:text-amber-200/80">
                  Personal auto insurance usually doesn&apos;t cover commercial delivery in Canada —
                  you&apos;ll need a delivery endorsement on your policy before you can be approved.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <div className="mt-14 rounded-2xl border border-line bg-gradient-to-br from-fg/[0.06] to-transparent p-8 text-center">
              <h3 className="text-[24px] font-semibold tracking-tight text-gradient sm:text-[28px]">
                Apply in about five minutes
              </h3>
              <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-fg-muted">
                Fill in your details, upload your documents, and we&apos;ll review your application.
                You&apos;ll know where you stand without having to chase anyone.
              </p>
              <div className="mt-7 flex justify-center">
                <PrimaryButton href="/signup/courier">Start your application</PrimaryButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
