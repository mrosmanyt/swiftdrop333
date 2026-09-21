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

export const metadata: Metadata = {
  title: "Features — everything SwiftDrop does for your business",
  description:
    "Live GPS tracking, automatic dispatch, flat-rate pricing, bulk upload, API and webhooks, recurring deliveries, age-verified and cold-chain handling, claims and bilingual tracking pages.",
};

/** Alternating feature blocks, each anchored to a real product screen. */
const BLOCKS = [
  {
    id: "booking",
    eyebrow: "Booking a delivery",
    title: "From counter to courier in under a minute",
    body: "Type the address and we autocomplete it, price it by real distance, and show the total before you confirm. Choose a delivery window, flag anything age-restricted, and say whether it needs to stay cold — the courier sees all of it before they set off.",
    points: [
      "Address autocomplete with exact distance pricing",
      "Morning / midday / afternoon / evening delivery windows",
      "Age-restricted and refrigerated handling flags",
      "Same Day, Next Day, Direct or Batch — you pick per order",
    ],
    shot: "/screenshots/merchant-new-order.png",
    label: "app.swiftdrop.ca/merchant/orders/new",
    alt: "The SwiftDrop new delivery form with address autocomplete, delivery window and handling requirements",
  },
  {
    id: "dashboard",
    eyebrow: "Staying on top of it",
    title: "Every delivery, and exactly where it is",
    body: "One screen shows what's out for delivery, what's waiting on a courier and what already landed. Open any order to watch the courier move on a live map — the same map your customer is looking at.",
    points: [
      "Live status for every active delivery",
      "Open any order for the live courier map and ETA",
      "Photo proof and the customer's rating attached to each delivery",
      "Full history, exportable whenever you need it",
    ],
    shot: "/screenshots/merchant-dashboard.png",
    label: "app.swiftdrop.ca/merchant/dashboard",
    alt: "The SwiftDrop merchant dashboard listing recent orders with their status, service type and price",
    reverse: true,
  },
  {
    id: "customer",
    eyebrow: "What your customer sees",
    title: "A tracking page that answers the question for you",
    body: "Your customer gets a link — no app, no account. They watch the courier approach on a live map, message them without either side sharing a phone number, and see a timestamped photo the moment it's delivered. In English or French.",
    points: [
      "Live map and ETA, updating every few seconds",
      "In-app chat — phone numbers stay private on both sides",
      "Photo proof of delivery, then a one-tap rating",
      "Fully bilingual (English / French)",
    ],
    shot: "/screenshots/customer-tracking.png",
    label: "app.swiftdrop.ca/track/…",
    alt: "The SwiftDrop customer tracking page showing the delivery timeline, proof of delivery photo and rating",
  },
  {
    id: "scale",
    eyebrow: "When volume picks up",
    title: "Send fifty at once, or let your store do it",
    body: "Upload a CSV and we'll create every delivery, telling you exactly which row failed and why if one does. Or give your online store an API key and let it book deliveries itself, with webhooks firing status updates straight back into your system.",
    points: [
      "CSV upload — up to 200 deliveries in one go",
      "REST API with your own keys, revocable any time",
      "Webhooks push status changes back to your system",
      "Recurring schedules for standing weekly deliveries",
    ],
    shot: "/screenshots/merchant-tools.png",
    label: "app.swiftdrop.ca/merchant/tools",
    alt: "The SwiftDrop merchant tools page showing bulk CSV upload, recurring deliveries and API key management",
    reverse: true,
  },
];

const GRID = [
  {
    title: "Automatic dispatch",
    body: "The nearest suitable courier is offered each delivery within seconds, with a countdown. Pass or timeout and it moves to the next one — nothing sits waiting to be noticed.",
    icon: (
      <>
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </>
    ),
  },
  {
    title: "Optimised multi-stop routes",
    body: "Nearby drop-offs are grouped and re-ordered into one efficient run. Shorter routes mean couriers earn more per hour without your price going up.",
    icon: (
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8.5 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5" />
      </>
    ),
  },
  {
    title: "Failed deliveries handled properly",
    body: "Nobody home? The courier records why and brings the parcel back to you. You're emailed immediately with the reason — it doesn't get left on a doorstep.",
    icon: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </>
    ),
  },
  {
    title: "Age & ID verification",
    body: "For alcohol and pharmacy, the delivery cannot be completed until the courier records an ID check. Refused? It returns to you automatically.",
    icon: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <circle cx="9" cy="11" r="2.2" />
        <path d="M5.5 16c.8-1.6 2-2.3 3.5-2.3s2.7.7 3.5 2.3M15 10h4M15 13.5h4" />
      </>
    ),
  },
  {
    title: "Cold chain handling",
    body: "Mark an order refrigerated or frozen and the courier is told an insulated bag is required before they accept it.",
    icon: (
      <>
        <path d="M12 2v20M4.2 7l15.6 10M19.8 7 4.2 17" />
      </>
    ),
  },
  {
    title: "Claims & disputes",
    body: "Damaged or missing? Raise a claim against the delivery and our team works it through to a resolution, refund included where it's warranted.",
    icon: (
      <>
        <path d="M12 3 3.5 18.5h17L12 3Z" />
        <path d="M12 10v3.5M12 16.5h.01" />
      </>
    ),
  },
  {
    title: "Transparent, published pricing",
    body: "Zone base rate plus distance, times your service level. The full rate card is public — no quotes to chase, no month-end surprises.",
    icon: (
      <>
        <path d="M12 2v20" />
        <path d="M17 6.5c0-2-2.2-3-5-3s-5 .9-5 3 2.2 2.8 5 3.3 5 1.2 5 3.4-2.2 3.3-5 3.3-5-1.2-5-3.3" />
      </>
    ),
  },
  {
    title: "No commission on your sales",
    body: "You pay for the delivery and nothing else. What the customer paid you for the goods stays yours — entirely.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
      </>
    ),
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid mask-fade-b opacity-50" />
        <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[440px] w-[780px] -translate-x-1/2 opacity-50" />

        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-20 sm:px-8 sm:pt-24">
          <Reveal>
            <SectionHeading
              eyebrow={<Eyebrow>Everything it does</Eyebrow>}
              title="The whole delivery operation, without hiring one"
              subtitle="These are real screens from the platform — what you see here is what you get when you sign up."
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
                    {b.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-[14.5px] text-fg/80">
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
                <Eyebrow>The courier side</Eyebrow>
                <h2 className="mt-5 text-balance text-[28px] font-semibold leading-[1.15] tracking-tightest text-gradient sm:text-[34px]">
                  Couriers who know the pay up front stick around
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
                  Every offer shows the exact payout, distance and drop-off before it&apos;s
                  accepted. Tier progress updates live, bonuses are visible while there&apos;s still
                  time to earn them, and cash-out is weekly and free. Better retention on their side
                  is faster delivery on yours.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <SecondaryButton href="/couriers">How courier pay works</SecondaryButton>
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
              title="And the rest of it"
              subtitle="The parts you only notice when they're missing."
            />
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GRID.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 60}>
                <Card className="h-full">
                  <Icon path={f.icon} />
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
              See it with your own deliveries
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15.5px] leading-relaxed text-fg-muted">
              Create a business account, get verified, and send your first delivery today. No
              contract, no monthly fee.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryButton href="/signup/merchant">Start delivering</PrimaryButton>
              <SecondaryButton href="/pricing">View pricing</SecondaryButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
