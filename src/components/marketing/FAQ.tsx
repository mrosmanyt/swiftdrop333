"use client";

import { useState } from "react";

const ITEMS = [
  {
    q: "How is the price worked out?",
    a: "A flat base rate for the delivery zone, plus a per-kilometre amount for the actual distance, adjusted by the service type you pick. Batch is the cheapest, Direct (a courier who carries nothing else) is the most expensive. You see the price before you confirm, and the full rate card is public.",
  },
  {
    q: "Do you take a commission on my sales?",
    a: "No. You pay for the delivery, and that's it. What the customer paid you for the goods is none of our business — that's the main reason local shops move to us from food-delivery style platforms.",
  },
  {
    q: "What happens if nobody's home?",
    a: "The courier records why, and the parcel comes back to you rather than being left somewhere unsafe. You get an email the moment that happens, with the reason attached, and the whole attempt is on the order's timeline.",
  },
  {
    q: "Can I send alcohol or pharmacy items?",
    a: "Yes, with ID verification switched on for that order. The courier physically cannot mark it delivered until they've recorded the ID check, and if the recipient can't produce ID the parcel is returned to you automatically.",
  },
  {
    q: "Does it connect to my online store?",
    a: "Yes. There's a REST API with your own keys and outbound webhooks, so your store can create deliveries and receive status updates automatically. If you'd rather not touch code, you can upload a CSV of up to 200 orders at once.",
  },
  {
    q: "What do couriers actually earn?",
    a: "72% of the delivery fee, plus a per-delivery bonus that grows with tier (up to 20¢ at Pro), plus any challenge bonuses. Surge raises the whole fare, so the courier's share goes up with it. Every courier can see a full breakdown of engaged time and effective hourly rate in their app.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line border-y border-line">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-5 text-left"
            >
              <span className={`text-[15.5px] font-medium transition-colors ${isOpen ? "text-fg" : "text-fg/80"}`}>
                {item.q}
              </span>
              <span
                className={`shrink-0 rounded-full border border-line p-1 text-fg-muted transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pr-10 text-[14.5px] leading-relaxed text-fg-muted">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
