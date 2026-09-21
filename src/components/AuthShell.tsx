import Link from "next/link";
import Logo from "@/components/marketing/Logo";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Shared frame for the public auth pages so the jump from the marketing
 * site into sign-in / sign-up doesn't feel like a different product.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  width = "sm",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "lg";
}) {
  return (
    <div className="themed-root relative min-h-screen bg-bg text-fg">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid mask-fade-b opacity-60" />
      <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 opacity-50" />

      <header className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="SwiftDrop home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main
        className={`relative mx-auto px-5 pb-20 pt-6 sm:px-8 ${
          width === "lg" ? "max-w-xl" : "max-w-md"
        }`}
      >
        <div className="mb-6">
          <h1 className="text-[28px] font-semibold tracking-tight text-fg">{title}</h1>
          {subtitle && <p className="mt-2 text-[14.5px] leading-relaxed text-fg-muted">{subtitle}</p>}
        </div>

        <div className="card-shadow rounded-2xl border border-line bg-surface p-6">{children}</div>

        {footer && <div className="mt-5 text-sm text-fg-muted">{footer}</div>}
      </main>
    </div>
  );
}
