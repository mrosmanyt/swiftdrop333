import type { CSSProperties } from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import AnnouncementBar from "@/components/marketing/AnnouncementBar";
import SitePopup from "@/components/marketing/SitePopup";
import PageViewBeacon from "@/components/marketing/PageViewBeacon";
import { getContent, inDateWindow, safeHref, visible } from "@/lib/cms/content";

/**
 * The public pages read their text from the website editor (admin console →
 * Website), so they are rendered per request rather than frozen at build
 * time. Published content is cached for ~20 seconds per server instance
 * (src/lib/cms/content.ts), so this costs at most one small query now and then.
 */
export const dynamic = "force-dynamic";

/**
 * Public marketing shell. `themed-root` tells the body to follow the
 * light/dark theme tokens (see globals.css); the signed-in portals keep
 * their own light styling.
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [site, announcement, popup] = await Promise.all([getContent("site"), getContent("announcement"), getContent("popup")]);

  const showBar = announcement.enabled && !!announcement.text.trim() && inDateWindow(announcement.startDate, announcement.endDate);
  const showPopup =
    popup.enabled && !!(popup.title.trim() || popup.text.trim() || popup.image) && inDateWindow(popup.startDate, popup.endDate);

  return (
    <div
      data-announce-root
      // Reserves room for the announcement bar before the browser has measured it.
      style={showBar ? ({ "--announce-h": "40px" } as CSSProperties) : undefined}
      className="themed-root min-h-screen bg-bg text-fg selection:bg-accent/25"
    >
      {showBar && (
        <AnnouncementBar
          text={announcement.text}
          linkLabel={announcement.linkLabel}
          linkHref={safeHref(announcement.linkHref)}
          color={announcement.color}
        />
      )}
      <MarketingNav
        links={visible(site.navLinks)
          .map((l) => ({ label: l.label, href: safeHref(l.href) }))
          .filter((l) => l.label && l.href)}
        signInLabel={site.navSignInLabel}
        ctaLabel={site.navCtaLabel}
      />
      <main className="pt-16" style={{ paddingTop: "calc(4rem + var(--announce-h, 0px))" }}>
        {children}
      </main>
      <MarketingFooter />
      {showPopup && (
        <SitePopup
          title={popup.title}
          text={popup.text}
          image={popup.image}
          buttonLabel={popup.buttonLabel}
          buttonHref={safeHref(popup.buttonHref)}
          pages={popup.pages}
          frequency={popup.frequency}
          delaySeconds={Number(popup.delaySeconds) || 0}
        />
      )}
      <PageViewBeacon />
    </div>
  );
}
