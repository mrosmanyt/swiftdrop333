import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/marketing/Reveal";
import { Eyebrow, SectionHeading } from "@/components/marketing/ui";
import ZoneCalculator from "@/components/marketing/ZoneCalculator";
import { getContent } from "@/lib/cms/content";

export const metadata: Metadata = {
  title: "Delivery zones and prices for your address | SwiftDrop",
  description: "Enter your pickup address to see every SwiftDrop delivery zone around it and what each one costs.",
};

/**
 * Zone price calculator. Wording: admin console → Website → Zone price
 * calculator. Prices: admin console → Zones & pricing (see src/lib/site/zones.ts).
 */
export default async function ZonesPage() {
  const c = await getContent("zones");
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid mask-fade-b opacity-50" />
      <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[760px] -translate-x-1/2 opacity-50" />
      <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 sm:px-8 sm:pt-24">
        <Reveal>
          <SectionHeading eyebrow={<Eyebrow>{c.eyebrow}</Eyebrow>} title={c.title} subtitle={c.subtitle} />
        </Reveal>
        <div className="mt-10">
          <ZoneCalculator note={c.note} outsideText={c.outsideText} />
        </div>
        <p className="mt-6 text-center text-[13.5px] text-fg-muted">
          Already a merchant?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>{" "}
          to book a delivery · New here?{" "}
          <Link href="/signup/merchant" className="text-accent hover:underline">
            Create a business account
          </Link>
        </p>
      </div>
    </section>
  );
}
