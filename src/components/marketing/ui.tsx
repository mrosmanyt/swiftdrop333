import Link from "next/link";

/** Small pill used above section headings and in the hero. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-[12px] text-fg-muted backdrop-blur">
      {children}
    </span>
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
      {eyebrow && <div className="mb-4">{eyebrow}</div>}
      <h2 className="text-balance text-3xl font-semibold tracking-tightest text-gradient sm:text-4xl md:text-[42px] md:leading-[1.1]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-[15px] leading-relaxed text-fg-muted sm:text-base">{subtitle}</p>
      )}
    </div>
  );
}

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
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl bg-inverse px-5 py-3 text-[14.5px] font-medium text-inverse-fg transition-transform hover:scale-[1.02] active:scale-[0.99] ${className}`}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
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
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-line bg-surface px-5 py-3 text-[14.5px] font-medium text-fg/85 backdrop-blur transition-colors hover:border-fg/25 hover:bg-surface-2 hover:text-fg ${className}`}
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
    <div
      className={`group card-shadow relative overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-fg/20 ${className}`}
    >
      {children}
    </div>
  );
}

export function Icon({ path }: { path: React.ReactNode }) {
  return (
    <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-accent/10 text-accent">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {path}
      </svg>
    </span>
  );
}
