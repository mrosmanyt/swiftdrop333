import Link from "next/link";

/**
 * The handful of shapes every portal screen needs. Before these existed the
 * same card, the same stat tile and the same "nothing here yet" line were
 * written slightly differently on every page, which is why the three panels
 * never quite looked like one product.
 */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="mt-1 text-[14.5px] text-fg-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`card-shadow overflow-hidden rounded-2xl border border-line bg-surface ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export type StatTone = "default" | "ok" | "warn" | "danger" | "accent";

const TONE: Record<StatTone, { box: string; value: string }> = {
  default: { box: "border-line bg-surface", value: "text-fg" },
  ok: { box: "border-ok/30 bg-ok-soft", value: "text-ok" },
  warn: { box: "border-warn/30 bg-warn-soft", value: "text-warn" },
  danger: { box: "border-danger/30 bg-danger-soft", value: "text-danger" },
  accent: { box: "border-accent/25 bg-accent/5", value: "text-accent" },
};

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatTone;
  href?: string;
}) {
  const t = TONE[tone];
  const inner = (
    <>
      <p className="text-[13px] text-fg-subtle">{label}</p>
      <p className={`mt-1 text-[26px] font-semibold leading-none ${t.value}`}>{value}</p>
      {hint && <p className="mt-1.5 text-[12px] text-fg-subtle">{hint}</p>}
    </>
  );
  const box = `block rounded-2xl border p-4 ${t.box}`;

  // A queue count is only useful if it takes you to the queue.
  return href ? (
    <Link href={href} className={`${box} transition-colors hover:border-accent/40`}>
      {inner}
    </Link>
  ) : (
    <div className={box}>{inner}</div>
  );
}

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-warn-soft text-warn",
  ASSIGNED: "bg-info-soft text-info",
  PICKED_UP: "bg-info-soft text-info",
  IN_TRANSIT: "bg-accent/10 text-accent",
  DELIVERED: "bg-ok-soft text-ok",
  FAILED: "bg-danger-soft text-danger",
  RETURNING: "bg-warn-soft text-warn",
  RETURNED: "bg-surface-2 text-fg-muted",
  CANCELLED: "bg-surface-2 text-fg-muted",
  verified: "bg-ok-soft text-ok",
  approved: "bg-ok-soft text-ok",
  pending: "bg-warn-soft text-warn",
  rejected: "bg-danger-soft text-danger",
  open: "bg-warn-soft text-warn",
  resolved: "bg-ok-soft text-ok",
};

/** A status you can tell apart at a glance, instead of SCREAMING_SNAKE text. */
export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "bg-surface-2 text-fg-muted";
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${tone}`}>
      {status.toLowerCase().replace(/_/g, " ")}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm font-medium text-fg">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-[13px] text-fg-subtle">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Tables are the one thing that genuinely can't reflow on a phone, so they
 *  get their own scroll container rather than stretching the whole page. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="-mx-px overflow-x-auto">{children}</div>;
}

/** A short, sayable reference for an order. Nobody reads a UUID aloud to a
 *  courier on the phone; the last six characters are enough to find it. */
export function orderRef(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}
