import type { Metadata } from "next";
import Reveal from "@/components/marketing/Reveal";
import ScreenShot from "@/components/marketing/ScreenShot";
import {
  Eyebrow,
  SectionHeading,
  PrimaryButton,
  SecondaryButton,
  Card,
  Icon,
} from "@/components/marketing/ui";
import { iconPath } from "@/components/marketing/icons";
import { getContent, visible } from "@/lib/cms/content";
import { pageMetadata } from "@/lib/cms/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("features");

/**
 * Alternating feature blocks, each anchored to a real product screen. The
 * screenshot, its caption and the layout stay here; the wording for each
 * block comes from the website editor (Website → Features page), matched
 * by position.
 */
const BLOCK_SHOTS = [
  {
    id: "booking",
    shot: "/screenshots/merchant-new-order.png",
    label: "app.swiftdrop.ca/merchant/orders/new",
    alt: "The SwiftDrop new delivery form with address autocomplete, delivery window and handling requirements",
  },
  {
    id: "dashboard",
    shot: "/screenshots/merchant-dashboard.png",
    label: "app.swiftdrop.ca/merchant/dashboard",
    alt: "The SwiftDrop merchant dashboard listing recent orders with their status, service type and price",
    reverse: true,
  },
  {
    id: "customer",
    shot: "/screenshots/customer-tracking.png",
    label: "app.swiftdrop.ca/track/…",
    alt: "The SwiftDrop customer tracking page showing the delivery timeline, proof of delivery photo and rating",
  },
  {
    id: "scale",
    shot: "/screenshots/merchant-tools.png",
    label: "app.swiftdrop.ca/merchant/tools",
    alt: "The SwiftDrop merchant tools page showing bulk CSV upload, recurring deliveries and API key management",
    reverse: true,
  },
];

export default async function FeaturesPage() {
  const c = await getContent("features");
  const BLOCKS = BLOCK_SHOTS.map((shot, i) => ({ ...shot, ...c.blocks[i] }));
  const GRID = visible(c.grid);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid mask-fade-b opacity-50" />
        <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[440px] w-[780px] -translate-x-1/2 opacity-50" />

        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-20 sm:px-8 sm:pt-24">
          <Reveal>
            <SectionHeading
              eyebrow={<Eyebrow>{c.heroEyebrow}</Eyebrow>}
              title={c.heroTitle}
              subtitle={c.heroSubtitle}
            />
          </Reveal>
        </div>
      </section>

      {/* Alternating feature blocks */}
      {BLOCKS.map((b, i) => (
        <section
          key={b.id}
          id={b.id}
          className={`scroll-mt-20 py-16 sm:py-20 ${
            i % 2 === 1 ? "border-y border-line bg-bg-soft" : ""
          }`}
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${
                b.reverse ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <Reveal>
                <div>
                  <Eyebrow>{b.eyebrow}</Eyebrow>
                  <h2 className="mt-5 text-balance text-[28px] font-semibold leading-[1.15] tracking-tightest text-gradient sm:text-[34px]">
                    {b.title}
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">{b.body}</p>
                  <ul className="mt-6 space-y-3">
                    {b.points.map((p, j) => (
                      <li key={`${p}-${j}`} className="flex items-start gap-3 text-[14.5px] text-fg/80">
                        <svg
                          viewBox="0 0 24 24"
                          className="mt-0.5 h-4 w-4 shrink-0 text-live"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={90}>
                <ScreenShot src={b.shot} alt={b.alt} label={b.label} priority={i === 0} />
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      {/* Courier side */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <div>
                <Eyebrow>{c.courierEyebrow}</Eyebrow>
                <h2 className="mt-5 text-balance text-[28px] font-semibold leading-[1.15] tracking-tightest text-gradient sm:text-[34px]">
                  {c.courierTitle}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
                  {c.courierText}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <SecondaryButton href="/couriers">{c.courierButtonLabel}</SecondaryButton>
                </div>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <ScreenShot
                src="/screenshots/driver-offers.png"
                alt="The SwiftDrop driver app showing a live delivery offer with the payout, distance and a countdown"
                label="Driver app — live offer"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Everything else grid */}
      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              title={c.gridTitle}
              subtitle={c.gridSubtitle}
            />
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GRID.map((f, i) => (
              <Reveal key={`${f.title}-${i}`} delay={(i % 4) * 60}>
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

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-line py-20 sm:py-24">
        <div className="glow pointer-events-none absolute bottom-[-220px] left-1/2 h-[460px] w-[760px] -translate-x-1/2 opacity-55" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <Reveal>
            <h2 className="text-balance text-[30px] font-semibold leading-[1.1] tracking-tightest text-gradient sm:text-[40px]">
              {c.ctaTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15.5px] leading-relaxed text-fg-muted">
              {c.ctaText}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryButton href="/signup/merchant">{c.ctaPrimaryLabel}</PrimaryButton>
              <SecondaryButton href="/pricing">{c.ctaSecondaryLabel}</SecondaryButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
