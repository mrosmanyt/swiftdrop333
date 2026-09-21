import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

/**
 * Public marketing shell. `themed-root` tells the body to follow the
 * light/dark theme tokens (see globals.css); the signed-in portals keep
 * their own light styling.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="themed-root min-h-screen bg-bg text-fg selection:bg-accent/25">
      <MarketingNav />
      <main className="pt-16">{children}</main>
      <MarketingFooter />
    </div>
  );
}
