import Link from "next/link";
import type { Metadata } from "next";
import TrackingPreview from "@/components/marketing/TrackingPreview";
import ScreenShot from "@/components/marketing/ScreenShot";
import Reveal from "@/components/marketing/Reveal";
import FAQ from "@/components/marketing/FAQ";
import { Eyebrow, SectionHeading, PrimaryButton, SecondaryButton, Card, Icon } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "SwiftDrop — Same-day local delivery for Canadian businesses",
  description:
    "Give your customers same-day delivery they can watch arrive. Flat-rate pricing, live GPS tracking, photo proof, and no commission on your sales.",
};

const CITIES = [
  "Toronto",
  "Vancouver",
  "Montréal",
  "Calgary",
  "Ottawa",
  "Edmonton",
  "Winnipeg",
  "Hamilton",
  "Mississauga",
  "Québec City",
];

export default function HomePage() {
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
                  Live in 10 Canadian cities
                </Eyebrow>
              </Reveal>

              <Reveal delay={60}>
                <h1 className="mt-6 text-balance text-[40px] font-semibold leading-[1.05] tracking-tightest sm:text-[54px] md:text-[62px]">
                  <span className="text-gradient">Same-day delivery</span>
                  <br />
                  <span className="text-gradient-accent">they can watch arrive.</span>
                </h1>
              </Reveal>

              <Reveal delay={120}>
                <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-fg-muted sm:text-[17px]">
                  SwiftDrop gives your shop its own local courier fleet. Flat-rate pricing, live GPS
                  tracking for every parcel, photo proof at the door — and we never take a cut of
                  what you sell.
                </p>
              </Reveal>

              <Reveal delay={180}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton href="/signup/merchant">
                    Start delivering
                    <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </PrimaryButton>
                  <SecondaryButton href="/couriers">Drive with us</SecondaryButton>
                </div>
              </Reveal>

              <Reveal delay={240}>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-fg-subtle">
                  <span className="flex items-center gap-2">
                    <Check /> No commission on sales
                  </span>
                  <span className="flex items-center gap-2">
                    <Check /> No monthly minimum
                  </span>
                  <span className="flex items-center gap-2">
                    <Check /> Live in minutes
                  </span>
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
          {[
            { value: "4.9★", label: "Average delivery rating" },
            { value: "97%", label: "On-time completion" },
            { value: "72%", label: "Of the fee goes to couriers" },
            { value: "< 2 hrs", label: "Typical same-day window" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 70}>
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
              eyebrow={<Eyebrow>How it works</Eyebrow>}
              title="Three steps. No logistics team required."
              subtitle="You keep serving customers. We handle everything between your counter and their door."
            />
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Book the delivery",
                body: "Type the address — or let your online store create the order automatically through our API. Price is shown before you confirm.",
              },
              {
                n: "02",
                title: "We dispatch instantly",
                body: "The nearest available courier is offered the job within seconds. If they pass, it moves to the next one automatically.",
              },
              {
                n: "03",
                title: "Everyone watches it arrive",
                body: "Your customer gets a live map and an ETA. You see the same thing. Photo proof lands the moment it's delivered.",
              },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 90}>
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
              eyebrow={<Eyebrow>The platform</Eyebrow>}
              title="Built for the parts of delivery that actually go wrong"
              subtitle="Late parcels, silent couriers, surprise invoices, packages left in the rain. Every feature here exists because one of those costs you a customer."
            />
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            {/* Wide: live tracking */}
            <Reveal className="md:col-span-4">
              <Card className="h-full">
                <Icon path={<><path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11Z" /><circle cx="12" cy="10" r="2.6" /></>} />
                <h3 className="text-[18px] font-semibold tracking-tight">Live GPS on every parcel</h3>
                <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-fg-muted">
                  The courier&apos;s position updates every few seconds — visible to your customer,
                  to you, and to our ops team at the same time. &quot;Where is my order?&quot; stops
                  being a support ticket.
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
                <h3 className="text-[18px] font-semibold tracking-tight">Published flat rates</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-fg-muted">
                  Our rate card is public. Zone-based, distance-aware, no percentage of your basket,
                  no surprise line items at month end.
                </p>
                <Link href="/pricing" className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] text-accent hover:underline">
                  See the rate card
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              </Card>
            </Reveal>

            {[
              {
                title: "Smart batch routes",
                body: "Nearby drops are grouped and re-ordered into one optimized run — measurably shorter routes, which is how couriers earn more without your price going up.",
                icon: <><path d="M4 7h7" /><path d="M4 12h12" /><path d="M4 17h16" /><circle cx="19" cy="7" r="2" /></>,
                span: "md:col-span-2",
              },
              {
                title: "Photo proof & ID checks",
                body: "Every delivery ends in a timestamped photo. Age-restricted orders can't be completed until the courier records an ID check.",
                icon: <><rect x="3" y="6" width="18" height="14" rx="2.5" /><circle cx="12" cy="13" r="3.2" /><path d="M8 6l1.5-2h5L16 6" /></>,
                span: "md:col-span-2",
              },
              {
                title: "API, webhooks & CSV",
                body: "Push orders from your own store, upload 50 at once, or fire webhooks back into your system. Bilingual tracking pages included.",
                icon: <><path d="M8 17 3 12l5-5" /><path d="m16 7 5 5-5 5" /><path d="M13.5 4.5 10.5 19.5" /></>,
                span: "md:col-span-2",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={120 + i * 70} className={f.span}>
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

      {/* ───────────────────────── Product shot ───────────────────────── */}
      <section className="pb-24 sm:pb-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow={<Eyebrow>Inside the app</Eyebrow>}
              title="This is the actual dashboard"
              subtitle="Not a mockup — a real screen from the platform, showing live deliveries, their status and what each one cost."
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
                See every feature
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
              Delivering across Canada
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
                <Eyebrow>For couriers</Eyebrow>
                <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tightest text-gradient sm:text-[38px] sm:leading-[1.12]">
                  Keep 72% of the fee. Know the pay before you accept.
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fg-muted">
                  Bike, scooter, car or van. Every offer shows the exact payout up front, your tier
                  progress updates live, and weekly cash-out is free.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton href="/signup/courier">Apply to drive</PrimaryButton>
                  <SecondaryButton href="/couriers">See how pay works</SecondaryButton>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: "72%", v: "of every delivery fee" },
                  { k: "+20¢", v: "per drop at Pro tier" },
                  { k: "Free", v: "weekly cash-out" },
                  { k: "0", v: "acceptance-rate minimum" },
                ].map((s, i) => (
                  <Reveal key={s.k} delay={i * 70}>
                    <div className="rounded-2xl border border-line bg-surface-2 p-5">
                      <p className="text-[24px] font-semibold tracking-tight">{s.k}</p>
                      <p className="mt-1 text-[12.5px] leading-snug text-fg-subtle">{s.v}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── FAQ ───────────────────────── */}
      <section className="pb-24 sm:pb-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading eyebrow={<Eyebrow>Questions</Eyebrow>} title="Good to know" />
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-12">
              <FAQ />
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
              Your first delivery can go out today.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-fg-muted">
              Sign up, get verified, and start sending. No contracts, no monthly fee, no cut of your
              sales.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryButton href="/signup/merchant">Create a business account</PrimaryButton>
              <SecondaryButton href="/pricing">View pricing</SecondaryButton>
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
