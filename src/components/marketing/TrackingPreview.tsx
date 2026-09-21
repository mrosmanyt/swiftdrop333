/**
 * The hero visual: a stylised version of the real customer tracking
 * screen. Pure SVG + CSS (animateMotion) — no map tiles, no JavaScript.
 * Colours come from the theme tokens so it reads correctly in both light
 * and dark.
 */
export default function TrackingPreview() {
  return (
    <div className="relative">
      <div className="glow pointer-events-none absolute -inset-16 -z-10 opacity-70" />

      <div className="hero-shadow overflow-hidden rounded-2xl border border-line bg-surface">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fg/10 text-[11px] font-semibold text-fg">
              CB
            </div>
            <div>
              <p className="text-[13px] font-medium leading-tight text-fg">Corner Bakery Co.</p>
              <p className="text-[11px] leading-tight text-fg-subtle">Order #8F2C41</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-live/10 px-2.5 py-1 text-[11px] font-medium text-live ring-1 ring-inset ring-live/25">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-live animate-pulse-ring" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
            </span>
            In transit
          </span>
        </div>

        {/* Map */}
        <div className="relative h-[210px] bg-bg-soft bg-line-grid sm:h-[250px]">
          <svg viewBox="0 0 400 240" className="absolute inset-0 h-full w-full" aria-hidden>
            <g stroke="rgb(var(--fg) / 0.06)" strokeWidth="14" strokeLinecap="round">
              <path d="M-10 70 H410" />
              <path d="M-10 170 H410" />
              <path d="M120 -10 V250" />
              <path d="M290 -10 V250" />
            </g>

            <path
              id="sd-route"
              d="M60 185 L120 185 L120 70 L290 70 L290 40 L340 40"
              fill="none"
              stroke="url(#sd-route-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M60 185 L120 185 L120 70 L290 70 L290 40 L340 40"
              fill="none"
              stroke="rgb(var(--surface))"
              strokeWidth="3"
              strokeDasharray="6 10"
              strokeLinecap="round"
              className="animate-route-dash"
              opacity="0.55"
            />

            <defs>
              <linearGradient id="sd-route-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.95" />
                <stop offset="100%" stopColor="rgb(var(--live))" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Pickup */}
            <g transform="translate(60,185)">
              <circle r="9" fill="rgb(var(--accent) / 0.2)" />
              <circle r="4.5" fill="rgb(var(--accent))" stroke="rgb(var(--surface))" strokeWidth="2" />
            </g>

            {/* Dropoff */}
            <g transform="translate(340,40)">
              <circle r="9" fill="rgb(var(--live) / 0.2)" />
              <circle r="4.5" fill="rgb(var(--live))" stroke="rgb(var(--surface))" strokeWidth="2" />
            </g>

            {/* Courier moving along the route */}
            <g>
              <circle r="13" fill="rgb(var(--accent) / 0.16)">
                <animateMotion dur="9s" repeatCount="indefinite" rotate="0">
                  <mpath href="#sd-route" />
                </animateMotion>
              </circle>
              <circle r="6" fill="rgb(var(--surface))" stroke="rgb(var(--accent))" strokeWidth="2.5">
                <animateMotion dur="9s" repeatCount="indefinite" rotate="0">
                  <mpath href="#sd-route" />
                </animateMotion>
              </circle>
            </g>
          </svg>

          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-line bg-surface/90 px-3 py-2 backdrop-blur-md">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-fg-subtle" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wide text-fg-subtle">Arriving in</p>
              <p className="text-[13px] font-semibold text-fg">7 min</p>
            </div>
          </div>

          <div className="absolute right-3 top-3 rounded-lg border border-line bg-surface/90 px-2.5 py-1.5 text-[11px] text-fg-muted backdrop-blur-md">
            2.4 km · bike
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 px-5 py-4">
          {[
            { label: "Order placed", done: true },
            { label: "Courier assigned", done: true },
            { label: "Picked up", done: true },
            { label: "In transit", done: true, active: true },
            { label: "Delivered", done: false },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  s.active ? "bg-live ring-4 ring-live/15" : s.done ? "bg-fg/60" : "bg-fg/15"
                }`}
              />
              <span className={`text-[13px] ${s.done ? "text-fg/85" : "text-fg-subtle"}`}>
                {s.label}
              </span>
              {s.active && <span className="ml-auto text-[11px] text-fg-subtle">now</span>}
            </div>
          ))}
        </div>

        {/* Chat teaser */}
        <div className="border-t border-line px-5 py-3.5">
          <div className="flex items-start gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fg/10 text-[10px]">
              🚴
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-fg/[0.06] px-3 py-2 text-[12.5px] text-fg/80">
              Almost there — which buzzer should I ring?
            </div>
          </div>
          <p className="mt-2 pl-9 text-[11px] text-fg-subtle">
            Chat stays in-app — nobody sees anyone&apos;s phone number.
          </p>
        </div>
      </div>
    </div>
  );
}
