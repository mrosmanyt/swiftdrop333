export default function Logo({ className = "", tone = "ink" }: { className?: string; tone?: "ink" | "light" }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-panel">
        {/* A route: pickup, a turn, drop-off. */}
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
          <path d="M5 17.5V11a4 4 0 0 1 4-4h6" stroke="rgb(var(--sun))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="5" cy="18" r="2" fill="rgb(var(--panel-fg))" />
          <circle cx="18" cy="7" r="2.6" fill="rgb(var(--sun))" />
        </svg>
      </span>
      <span
        className={`font-display text-[21px] leading-none ${tone === "light" ? "text-panel-fg" : "text-fg"}`}
      >
        SwiftDrop
      </span>
    </span>
  );
}
