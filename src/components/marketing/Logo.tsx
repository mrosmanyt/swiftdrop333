export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent-bright to-accent shadow-[0_0_20px_-6px_rgb(var(--accent))]">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M3 13.5 10.5 6l4 4L21 3.5"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10.5" cy="6" r="1.6" fill="white" />
          <path d="M4 20h16" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-tight text-fg">SwiftDrop</span>
    </span>
  );
}
