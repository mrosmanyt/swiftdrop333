import Link from "next/link";
import Logo from "@/components/marketing/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import SitePhoto, { hasPhoto } from "@/components/marketing/SitePhoto";
import type { SiteImageKey } from "@/lib/site/images";

/**
 * Shared frame for the public auth pages so the jump from the marketing
 * site into sign-in / sign-up doesn't feel like a different product.
 *
 * On wide screens the form sits beside a deep evergreen panel (a photograph
 * once one is supplied in src/lib/site/images.ts). The wide business
 * sign-up (`width="xl"`) needs the whole row, so it has no side panel.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  width = "sm",
  bare = false,
  photo: photoKey = "authSide",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "lg" | "xl";
  /** true = the page lays out its own cards (used by the two-column business sign-up). */
  bare?: boolean;
  /** Side-panel photograph for this page (src/lib/site/images.ts). Falls back to authSide. */
  photo?: SiteImageKey;
}) {
  const withPanel = width !== "xl";
  const sidePhoto: SiteImageKey = hasPhoto(photoKey) ? photoKey : "authSide";
  const photo = hasPhoto(sidePhoto);

  const form = (
    <>
      <div className="mb-7">
        <h1 className="font-display text-[40px] leading-[1] text-fg sm:text-[48px]">{title}</h1>
        {subtitle && <p className="mt-3 text-[16px] leading-relaxed text-fg-muted">{subtitle}</p>}
      </div>

      {bare ? children : <div className="rounded-[20px] border border-line bg-surface p-6 sm:p-7">{children}</div>}

      {footer && <div className="mt-5 text-[15px] text-fg-muted">{footer}</div>}
    </>
  );

  return (
    <div className="themed-root relative min-h-screen bg-bg text-fg">
      <header className="relative mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="SwiftDrop home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      {withPanel ? (
        <div className="mx-auto grid max-w-[1400px] gap-6 px-3 pb-6 sm:px-5 lg:grid-cols-2">
          <main className={`mx-auto w-full px-2 pb-14 pt-6 sm:px-3 lg:pt-12 ${width === "lg" ? "max-w-xl" : "max-w-md"}`}>
            {form}
          </main>

          <aside className="relative hidden min-h-[calc(100vh-5.5rem)] overflow-hidden rounded-[28px] bg-panel text-panel-fg lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)]">
            <SitePhoto name={sidePhoto} alt="" sizes="50vw" />
            {photo ? (
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[rgb(6_32_25/0.9)] via-[rgb(6_32_25/0.15)] to-transparent" />
            ) : (
              <RouteArt />
            )}
            <p className="font-display absolute inset-x-0 bottom-0 p-10 text-[44px] leading-[1] xl:text-[56px]">
              Local delivery,
              <br />
              done right.
            </p>
          </aside>
        </div>
      ) : (
        <main className="relative mx-auto max-w-6xl px-5 pb-20 pt-6 sm:px-8">{form}</main>
      )}
    </div>
  );
}

/** Stand-in for the photograph: one long route across the panel. */
function RouteArt() {
  return (
    <svg aria-hidden viewBox="0 0 400 560" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <path
        d="M-20 380 C 80 380, 80 290, 170 290 S 250 170, 330 170 S 380 80, 430 60"
        fill="none"
        stroke="rgb(var(--sun))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 12"
      />
      <circle cx="170" cy="290" r="7" fill="rgb(var(--panel-fg))" />
      <circle cx="330" cy="170" r="11" fill="rgb(var(--sun))" />
      <circle cx="330" cy="170" r="22" fill="none" stroke="rgb(var(--sun))" strokeOpacity="0.35" strokeWidth="2" />
    </svg>
  );
}
