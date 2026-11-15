import type { Metadata } from "next";
import Reveal from "@/components/marketing/Reveal";
import { Eyebrow, SectionHeading } from "@/components/marketing/ui";
import ContactForm from "@/components/marketing/ContactForm";
import { getContent, safeHref } from "@/lib/cms/content";
import { pageMetadata } from "@/lib/cms/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("contact");

/**
 * Contact page. Messages sent here appear in the admin console under
 * Website → Enquiries. Wording: Website → Contact page. Phone, WhatsApp,
 * email and address: Website → Menu, footer & contact details.
 */
export default async function ContactPage() {
  const [c, site] = await Promise.all([getContent("contact"), getContent("site")]);
  const waDigits = site.whatsapp.replace(/[^\d]/g, "");
  const mapLink = safeHref(site.mapLink);
  const details = [
    site.phone && { label: "Phone", value: site.phone, href: `tel:${site.phone.replace(/[^\d+]/g, "")}` },
    waDigits && { label: "WhatsApp", value: site.whatsapp, href: `https://wa.me/${waDigits}` },
    site.email && { label: "Email", value: site.email, href: `mailto:${site.email}` },
    site.address && { label: "Address", value: site.address, href: mapLink || undefined },
    site.hours && { label: "Hours", value: site.hours, href: undefined },
  ].filter(Boolean) as { label: string; value: string; href?: string }[];

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid mask-fade-b opacity-50" />
      <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[760px] -translate-x-1/2 opacity-50" />

      <div className="relative mx-auto max-w-5xl px-5 pb-24 pt-20 sm:px-8 sm:pt-24">
        <Reveal>
          <SectionHeading eyebrow={<Eyebrow>{c.eyebrow}</Eyebrow>} title={c.title} subtitle={c.intro} />
        </Reveal>

        <div className={`mt-12 grid gap-6 ${details.length ? "lg:grid-cols-[1.5fr_1fr]" : "mx-auto max-w-2xl"}`}>
          <Reveal delay={80}>
            <div className="card-shadow rounded-2xl border border-line bg-surface p-6">
              <ContactForm types={c.types} buttonLabel={c.buttonLabel} successTitle={c.successTitle} successText={c.successText} />
            </div>
          </Reveal>

          {details.length > 0 && (
            <Reveal delay={140}>
              <div className="card-shadow rounded-2xl border border-line bg-surface p-6">
                <dl className="space-y-5">
                  {details.map((d) => (
                    <div key={d.label}>
                      <dt className="text-[12px] uppercase tracking-wider text-fg-subtle">{d.label}</dt>
                      <dd className="mt-1 whitespace-pre-line text-[15px] text-fg">
                        {d.href ? (
                          <a href={d.href} className="transition-colors hover:text-accent" {...(d.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                            {d.value}
                          </a>
                        ) : (
                          d.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
