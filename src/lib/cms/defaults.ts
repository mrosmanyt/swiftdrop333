/**
 * The ORIGINAL website content, exactly as it was written in the page files
 * before the website editor existed. This is the "seed":
 *
 *  - every editor in the admin console starts from these values;
 *  - a section that has never been published (or was "restored to original")
 *    is rendered from here, so the site looks the same as it always did;
 *  - if the database can't be reached, the public pages fall back to this.
 *
 * Shapes here are the contract between the editor (src/lib/cms/sections.ts)
 * and the pages that render the content. Add a field in both places.
 */
export const DEFAULTS = {
  // ------------------------------------------------------------------ home
  home: {
    heroBadge: "Live in 10 Canadian cities",
    heroLine1: "Same-day delivery",
    heroLine2: "they can watch arrive.",
    heroText:
      "SwiftDrop gives your shop its own local courier fleet. Flat-rate pricing, live GPS tracking for every parcel, photo proof at the door — and we never take a cut of what you sell.",
    heroPrimaryLabel: "Start delivering",
    heroPrimaryHref: "/signup/merchant",
    heroSecondaryLabel: "Drive with us",
    heroSecondaryHref: "/couriers",
    heroChecks: ["No commission on sales", "No monthly minimum", "Live in minutes"],
    stats: [
      { value: "4.9★", label: "Average delivery rating" },
      { value: "97%", label: "On-time completion" },
      { value: "72%", label: "Of the fee goes to couriers" },
      { value: "< 2 hrs", label: "Typical same-day window" },
    ],
    howEyebrow: "How it works",
    howTitle: "Three steps. No logistics team required.",
    howSubtitle: "You keep serving customers. We handle everything between your counter and their door.",
    steps: [
      {
        n: "01",
        title: "Book the delivery",
        body: "Type the address — or let your online store create the order automatically through our API. Price is shown before you confirm.",
      },
      {
        n: "02",
        title: "We dispatch instantly",
        body: "The nearest available courier is offered the job within seconds. If they pass, it moves to the next one automatically.",
      },
      {
        n: "03",
        title: "Everyone watches it arrive",
        body: "Your customer gets a live map and an ETA. You see the same thing. Photo proof lands the moment it's delivered.",
      },
    ],
    featEyebrow: "The platform",
    featTitle: "Built for the parts of delivery that actually go wrong",
    featSubtitle:
      "Late parcels, silent couriers, surprise invoices, packages left in the rain. Every feature here exists because one of those costs you a customer.",
    featWideTitle: "Live GPS on every parcel",
    featWideBody:
      "The courier's position updates every few seconds — visible to your customer, to you, and to our ops team at the same time. \"Where is my order?\" stops being a support ticket.",
    featTallTitle: "Published flat rates",
    featTallBody:
      "Our rate card is public. Zone-based, distance-aware, no percentage of your basket, no surprise line items at month end.",
    featTallLinkLabel: "See the rate card",
    featCards: [
      {
        icon: "batch",
        title: "Smart batch routes",
        body: "Nearby drops are grouped and re-ordered into one optimized run — measurably shorter routes, which is how couriers earn more without your price going up.",
      },
      {
        icon: "camera",
        title: "Photo proof & ID checks",
        body: "Every delivery ends in a timestamped photo. Age-restricted orders can't be completed until the courier records an ID check.",
      },
      {
        icon: "code",
        title: "API, webhooks & CSV",
        body: "Push orders from your own store, upload 50 at once, or fire webhooks back into your system. Bilingual tracking pages included.",
      },
    ],
    shotEyebrow: "Inside the app",
    shotTitle: "This is the actual dashboard",
    shotSubtitle:
      "Not a mockup — a real screen from the platform, showing live deliveries, their status and what each one cost.",
    shotButtonLabel: "See every feature",
    coverageTitle: "Delivering across Canada",
    cities: [
      "Toronto",
      "Vancouver",
      "Montréal",
      "Calgary",
      "Ottawa",
      "Edmonton",
      "Winnipeg",
      "Hamilton",
      "Mississauga",
      "Québec City",
    ],
    courierEyebrow: "For couriers",
    courierTitle: "Keep 72% of the fee. Know the pay before you accept.",
    courierText:
      "Bike, scooter, car or van. Every offer shows the exact payout up front, your tier progress updates live, and weekly cash-out is free.",
    courierPrimaryLabel: "Apply to drive",
    courierSecondaryLabel: "See how pay works",
    courierStats: [
      { value: "72%", label: "of every delivery fee" },
      { value: "+20¢", label: "per drop at Pro tier" },
      { value: "Free", label: "weekly cash-out" },
      { value: "0", label: "acceptance-rate minimum" },
    ],
    faqEyebrow: "Questions",
    faqTitle: "Good to know",
    ctaTitle: "Your first delivery can go out today.",
    ctaText: "Sign up, get verified, and start sending. No contracts, no monthly fee, no cut of your sales.",
    ctaPrimaryLabel: "Create a business account",
    ctaPrimaryHref: "/signup/merchant",
    ctaSecondaryLabel: "View pricing",
    ctaSecondaryHref: "/pricing",
  },

  // -------------------------------------------------------------- features
  features: {
    heroEyebrow: "Everything it does",
    heroTitle: "The whole delivery operation, without hiring one",
    heroSubtitle:
      "These are real screens from the platform — what you see here is what you get when you sign up.",
    // The screenshot shown beside each block is fixed in the page (by
    // position), so this list can be edited but not re-ordered or extended.
    blocks: [
      {
        eyebrow: "Booking a delivery",
        title: "From counter to courier in under a minute",
        body: "Type the address and we autocomplete it, price it by real distance, and show the total before you confirm. Choose a delivery window, flag anything age-restricted, and say whether it needs to stay cold — the courier sees all of it before they set off.",
        points: [
          "Address autocomplete with exact distance pricing",
          "Morning / midday / afternoon / evening delivery windows",
          "Age-restricted and refrigerated handling flags",
          "Same Day, Next Day, Direct or Batch — you pick per order",
        ],
      },
      {
        eyebrow: "Staying on top of it",
        title: "Every delivery, and exactly where it is",
        body: "One screen shows what's out for delivery, what's waiting on a courier and what already landed. Open any order to watch the courier move on a live map — the same map your customer is looking at.",
        points: [
          "Live status for every active delivery",
          "Open any order for the live courier map and ETA",
          "Photo proof and the customer's rating attached to each delivery",
          "Full history, exportable whenever you need it",
        ],
      },
      {
        eyebrow: "What your customer sees",
        title: "A tracking page that answers the question for you",
        body: "Your customer gets a link — no app, no account. They watch the courier approach on a live map, message them without either side sharing a phone number, and see a timestamped photo the moment it's delivered. In English or French.",
        points: [
          "Live map and ETA, updating every few seconds",
          "In-app chat — phone numbers stay private on both sides",
          "Photo proof of delivery, then a one-tap rating",
          "Fully bilingual (English / French)",
        ],
      },
      {
        eyebrow: "When volume picks up",
        title: "Send fifty at once, or let your store do it",
        body: "Upload a CSV and we'll create every delivery, telling you exactly which row failed and why if one does. Or give your online store an API key and let it book deliveries itself, with webhooks firing status updates straight back into your system.",
        points: [
          "CSV upload — up to 200 deliveries in one go",
          "REST API with your own keys, revocable any time",
          "Webhooks push status changes back to your system",
          "Recurring schedules for standing weekly deliveries",
        ],
      },
    ],
    courierEyebrow: "The courier side",
    courierTitle: "Couriers who know the pay up front stick around",
    courierText:
      "Every offer shows the exact payout, distance and drop-off before it's accepted. Tier progress updates live, bonuses are visible while there's still time to earn them, and cash-out is weekly and free. Better retention on their side is faster delivery on yours.",
    courierButtonLabel: "How courier pay works",
    gridTitle: "And the rest of it",
    gridSubtitle: "The parts you only notice when they're missing.",
    grid: [
      {
        icon: "pulse",
        title: "Automatic dispatch",
        body: "The nearest suitable courier is offered each delivery within seconds, with a countdown. Pass or timeout and it moves to the next one — nothing sits waiting to be noticed.",
      },
      {
        icon: "route",
        title: "Optimised multi-stop routes",
        body: "Nearby drop-offs are grouped and re-ordered into one efficient run. Shorter routes mean couriers earn more per hour without your price going up.",
      },
      {
        icon: "return",
        title: "Failed deliveries handled properly",
        body: "Nobody home? The courier records why and brings the parcel back to you. You're emailed immediately with the reason — it doesn't get left on a doorstep.",
      },
      {
        icon: "id",
        title: "Age & ID verification",
        body: "For alcohol and pharmacy, the delivery cannot be completed until the courier records an ID check. Refused? It returns to you automatically.",
      },
      {
        icon: "snow",
        title: "Cold chain handling",
        body: "Mark an order refrigerated or frozen and the courier is told an insulated bag is required before they accept it.",
      },
      {
        icon: "alert",
        title: "Claims & disputes",
        body: "Damaged or missing? Raise a claim against the delivery and our team works it through to a resolution, refund included where it's warranted.",
      },
      {
        icon: "dollar",
        title: "Transparent, published pricing",
        body: "Zone base rate plus distance, times your service level. The full rate card is public — no quotes to chase, no month-end surprises.",
      },
      {
        icon: "nocut",
        title: "No commission on your sales",
        body: "You pay for the delivery and nothing else. What the customer paid you for the goods stays yours — entirely.",
      },
    ],
    ctaTitle: "See it with your own deliveries",
    ctaText:
      "Create a business account, get verified, and send your first delivery today. No contract, no monthly fee.",
    ctaPrimaryLabel: "Start delivering",
    ctaSecondaryLabel: "View pricing",
  },

  // --------------------------------------------------------------- pricing
  pricing: {
    heroEyebrow: "Pricing",
    heroTitle: "The rate card, in public.",
    heroSubtitle:
      "Most couriers make you ask for a quote. Here's exactly what a delivery costs: a zone base rate, plus distance, times your service level. Nothing else.",
    // Order is fixed: Batch, Next Day, Same Day, Direct. The multiplier shown
    // on each card comes from the pricing engine, not from here.
    services: [
      {
        name: "Batch",
        tagline: "Cheapest per drop",
        body: "Your parcel joins an optimized multi-stop route. Best for high volume where same-hour isn't critical.",
        best: "15+ orders a day",
      },
      {
        name: "Next Day",
        tagline: "Plan ahead",
        body: "Booked today, delivered tomorrow inside your chosen window. Non-perishables and catalogue orders.",
        best: "Retail & e-commerce",
      },
      {
        name: "Same Day",
        tagline: "Everyday default",
        body: "Picked up and delivered today, inside a window you choose — the service most merchants run on.",
        best: "Pharmacy, retail, gifts",
      },
      {
        name: "Direct",
        tagline: "Nothing else on board",
        body: "A courier carries your parcel and nothing else, straight there. Fragile, urgent and VIP orders.",
        best: "Florists, bakeries, VIP",
      },
    ],
    popularLabel: "Most popular",
    zonesTitle: "Live zone rates",
    zonesSubtitle:
      "These are the real rates running in the platform right now — the same numbers the pricing engine uses when it quotes you.",
    zonesNote:
      "Prices shown before tax. Surge may apply in severe weather or peak periods — it's capped, always displayed before you confirm, and the courier's share rises with it. Volume pricing is available once you're past roughly 300 deliveries a month.",
    includedTitle: "Everything is included",
    includedSubtitle: "There is no premium tier. Every account gets the whole platform.",
    included: [
      "Live GPS tracking on every order",
      "Bilingual tracking pages (EN / FR)",
      "Photo proof of delivery",
      "In-app courier ↔ customer chat",
      "Automatic SMS & email updates",
      "REST API, webhooks & CSV upload",
      "Recurring delivery schedules",
      "Age-verification & cold-chain handling",
      "Return-to-sender on failed delivery",
      "Claims & dispute resolution",
    ],
    ctaPrimaryLabel: "Start delivering",
    ctaSecondaryLabel: "Drive with us",
  },

  // -------------------------------------------------------------- couriers
  couriers: {
    heroEyebrow: "Now onboarding couriers",
    heroLine1: "Know what you'll earn",
    heroLine2: "before you accept.",
    heroText:
      "Every offer shows the exact payout, the distance and the drop-off up front. No mystery fares, no acceptance-rate punishment, no waiting two weeks to get paid.",
    heroPrimaryLabel: "Apply to drive",
    heroSecondaryLabel: "See the tiers",
    heroNote: "Bike · Scooter · Car · Van — bike couriers don't need a licence or vehicle insurance.",
    why: [
      {
        icon: "dollar",
        title: "72% of the fee, always",
        body: "We keep 28% to run the platform. Surge raises the whole fare, so when it's snowing your share goes up too — it isn't kept by us.",
      },
      {
        icon: "wallet",
        title: "Cash out when you want",
        body: "Weekly payouts are free. Need it today? Instant cash-out costs 1.5%. Your balance updates the moment a delivery completes.",
      },
      {
        icon: "calendar",
        title: "Pay you can actually check",
        body: "Your app shows engaged hours, earnings, bonuses and effective hourly rate for every period — plus exactly how each fare was calculated.",
      },
    ],
    tiersEyebrow: "Courier+ programme",
    tiersTitle: "Tiers you can see yourself climbing",
    tiersSubtitle:
      "Progress updates live in your app — not revealed at the end of the period when it's too late to do anything about it.",
    tiers: [
      {
        name: "Starter",
        bonus: "—",
        requirement: "Everyone starts here",
        perks: ["Standard offers", "Weekly free cash-out", "In-app support"],
        featured: false,
      },
      {
        name: "Silver",
        bonus: "+5¢",
        requirement: "50 deliveries · 95% completion",
        perks: ["Everything in Starter", "Earlier offer visibility"],
        featured: false,
      },
      {
        name: "Gold",
        bonus: "+10¢",
        requirement: "120 deliveries · 97% completion · 0 misdeliveries",
        perks: ["Everything in Silver", "Priority on batch routes"],
        featured: false,
      },
      {
        name: "Pro",
        bonus: "+20¢",
        requirement: "200 deliveries · 98% completion · no complaints",
        perks: ["Everything in Gold", "First look at every drop", "Priority support line", "Exclusive challenges"],
        featured: true,
      },
    ],
    reqTitle: "What you need to start",
    reqEveryoneLabel: "Everyone",
    reqEveryone: [
      "Legally eligible to work in Canada",
      "A smartphone with location turned on",
      "Government photo ID",
      "A way to carry parcels up to 9 kg",
    ],
    reqVehicleLabel: "Car, van or scooter",
    reqVehicle: [
      "Valid driver's licence",
      "Vehicle registration",
      "Insurance covering commercial delivery use",
      "Background check (we run it — takes a day or two)",
    ],
    reqNote:
      "Personal auto insurance usually doesn't cover commercial delivery in Canada — you'll need a delivery endorsement on your policy before you can be approved.",
    applyTitle: "Apply in about five minutes",
    applyText:
      "Fill in your details, upload your documents, and we'll review your application. You'll know where you stand without having to chase anyone.",
    applyButtonLabel: "Start your application",
  },

  // ------------------------------------------------------------------- faq
  faq: {
    items: [
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
    ],
  },

  // --------------------------------------------------------------- privacy
  privacy: {
    title: "Privacy",
    intro: "How SwiftDrop handles personal information, in plain language.",
    sections: [
      {
        h: "What we never collect",
        p: [
          "SwiftDrop does not collect or store payment card numbers, bank account numbers, transit or institution numbers, void cheques, or Social Insurance Numbers. When payments and payouts are enabled they are handled by a payment provider, and those details stay with that provider.",
        ],
      },
      {
        h: "What we collect, and why",
        p: [
          "Customers: the name, delivery address, phone number and email a business gives us for your delivery, so a courier can reach you and you can track it. If you create an account: your email, name, optional phone number and any addresses you save.",
          "Couriers: name, contact details, vehicle details, licence and insurance expiry dates, the last four characters of your licence and policy numbers, an emergency contact you choose to add, and your location while you are online or on a delivery. Uploaded licence/insurance documents are used only to verify your application.",
          "Businesses: business name, contact person, business phone and address, and your CRA business number.",
        ],
      },
      {
        h: "How long we keep it",
        p: [
          "Identity documents are stored encrypted and the files are deleted automatically 30 days after your application is reviewed (or after 180 days if it is never completed). We keep only the decision and expiry dates.",
          "Courier location points are kept for 24 hours. Delivery photos are deleted after 90 days. Chat messages are deleted 90 days after a delivery ends. SMS/email delivery logs never contain message text and are deleted after 90 days.",
          "A customer's phone number, email and delivery instructions are removed from a delivery 12 months after it ends. Order totals and dates are kept without contact details because businesses must keep financial records.",
        ],
      },
      {
        h: "Who can see it",
        p: [
          "The business that booked a delivery and the courier assigned to it see what they need for that delivery. A tracking link shows only the delivery status, map, first name and addresses — never phone numbers or emails. SwiftDrop staff access identity documents only to review applications, and every view is logged.",
        ],
      },
      {
        h: "Deleting your data",
        p: [
          "Customers can delete their account at any time from Account & privacy; it is erased immediately. Couriers and businesses can close their account there too: sign-in stops right away and personal details and documents are permanently erased after 30 days, so pending payouts or claims can be settled first. You can also ask our support team to delete your data or tell you what we hold about you.",
        ],
      },
    ],
  },

  // ------------------------------------------- site-wide: nav, footer, contact
  site: {
    navLinks: [
      { label: "How it works", href: "/#how" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Drive with us", href: "/couriers" },
    ],
    navSignInLabel: "Sign in",
    navCtaLabel: "Get started",
    footerText:
      "Same-day local delivery for Canadian businesses. Live tracked, flat-rate, and no commission on what you sell.",
    footerStatus: "All systems operational",
    footerCopyright: "SwiftDrop Technologies Inc. Made in Canada 🇨🇦",
    // Contact details are empty until you fill them in. Anything left empty
    // is simply not shown on the website.
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    mapLink: "",
    hours: "",
    facebook: "",
    instagram: "",
    x: "",
    linkedin: "",
    tiktok: "",
    youtube: "",
    showContactLink: false,
  },

  // ---------------------------------------------------------- contact page
  contact: {
    eyebrow: "Contact",
    title: "Talk to our team",
    intro:
      "Questions about pricing, coverage or connecting your store? Send us a message and a real person will get back to you.",
    types: ["Business delivery", "Become a courier", "Partnership", "Something else"],
    buttonLabel: "Send message",
    successTitle: "Thanks — we've got it.",
    successText: "Someone from our team will reply as soon as possible, usually within one business day.",
  },

  // ------------------------------------------------------ announcement bar
  announcement: {
    enabled: false,
    text: "",
    linkLabel: "",
    linkHref: "",
    color: "blue",
    startDate: "",
    endDate: "",
  },

  // ----------------------------------------------------------------- popup
  popup: {
    enabled: false,
    title: "",
    text: "",
    image: "",
    buttonLabel: "",
    buttonHref: "",
    pages: "all",
    frequency: "once",
    delaySeconds: "3",
    startDate: "",
    endDate: "",
  },

  // ------------------------------------------------- Google & sharing (SEO)
  seo: {
    homeTitle: "SwiftDrop — Same-day local delivery for Canadian businesses",
    homeDescription:
      "Give your customers same-day delivery they can watch arrive. Flat-rate pricing, live GPS tracking, photo proof, and no commission on your sales.",
    homeImage: "",
    featuresTitle: "Features — everything SwiftDrop does for your business",
    featuresDescription:
      "Live GPS tracking, automatic dispatch, flat-rate pricing, bulk upload, API and webhooks, recurring deliveries, age-verified and cold-chain handling, claims and bilingual tracking pages.",
    featuresImage: "",
    pricingTitle: "Pricing — SwiftDrop",
    pricingDescription:
      "Published flat rates by zone. No commission on your sales, no monthly minimum, no surprise line items.",
    pricingImage: "",
    couriersTitle: "Drive with SwiftDrop — Earn on your own schedule",
    couriersDescription:
      "Deliver by bike, scooter, car or van. Keep 72% of every delivery fee, see the pay before you accept, and cash out weekly for free.",
    couriersImage: "",
    privacyTitle: "Privacy — SwiftDrop",
    privacyDescription:
      "What personal information SwiftDrop collects, why, how long it's kept, and how to have it deleted.",
    privacyImage: "",
    contactTitle: "Contact — SwiftDrop",
    contactDescription: "Get in touch with the SwiftDrop team about delivery for your business.",
    contactImage: "",
  },

  // ---------------------------------------- email alerts (never sent to the browser)
  alerts: {
    enabled: false,
    recipients: [] as string[],
  },
};

export type CmsContent = typeof DEFAULTS;
export type SectionKey = keyof CmsContent;
export const SECTION_KEYS = Object.keys(DEFAULTS) as SectionKey[];

/** Sections that must never be included in anything the public can read. */
export const PRIVATE_SECTIONS: SectionKey[] = ["alerts"];
