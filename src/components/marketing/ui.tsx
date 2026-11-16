import Link from "next/link";

/** Short label that names a section. Plain text, no pill, no capitals. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-accent">{children}</span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <div className="mb-3">{eyebrow}</div>}
      <h2 className="font-display text-balance text-[34px] leading-[1.02] text-fg sm:text-[44px] md:text-[52px]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-[16px] leading-relaxed text-fg-muted sm:text-[17px]">{subtitle}</p>
      )}
    </div>
  );
}

/** The main action on a screen: the one warm-yellow button. */
export function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-sun px-6 py-3.5 text-[15px] font-semibold text-sun-ink transition-[filter,transform] hover:brightness-105 active:translate-y-px ${className}`}
    >
      {children}
    </Link>
  );
}

export function SecondaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-fg/25 px-6 py-3.5 text-[15px] font-semibold text-fg transition-colors hover:border-fg/60 hover:bg-fg/[0.04] ${className}`}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-[20px] border border-line bg-surface p-6 sm:p-7 ${className}`}>
      {children}
    </div>
  );
}

export function Icon({ path }: { path: React.ReactNode }) {
  return (
    <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-panel text-sun">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {path}
      </svg>
    </span>
  );
}
