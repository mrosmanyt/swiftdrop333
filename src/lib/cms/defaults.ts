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
    heroBadge: "Live in 8 Canadian cities",
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
    cities: ["Calgary", "Edmonton", "Hamilton", "Oshawa", "Ottawa", "Toronto", "Vancouver", "Winnipeg"],
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
    calcLabel: "Check the price for your address",
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
      { label: "Products", href: "/products" },
      { label: "Pricing", href: "/pricing" },
      { label: "Cities", href: "/cities" },
      { label: "Industries", href: "/industries" },
      { label: "How it works", href: "/how-it-works" },
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
    showContactLink: true,
  },

  // ---------------------------------------------------------- contact page
  contact: {
    eyebrow: "Contact",
    title: "Talk to our team",
    intro:
      "Questions about pricing, coverage or connecting your store? Send us a message and a real person will get back to you.",
    types: ["I want to ship with SwiftDrop", "I want to drive for SwiftDrop", "Partnership", "Something else"],
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

  // -------------------------------------------------------------- products
  products: {
    eyebrow: "Products",
    title: "Four ways to deliver. Pick per order.",
    subtitle:
      "Delivery isn't one size fits all. Choose the speed and price that suits each parcel — you can mix them freely, order by order.",
    items: [
      {
        icon: "calendar",
        name: "Next Day",
        tagline: "Our most affordable scheduled option",
        body: "Book by the evening cut-off and it is picked up and delivered the next day, inside the window you choose. Ideal for catalogue orders and anything that isn't perishable.",
        points: ["Lowest scheduled price", "Morning, midday, afternoon or evening window", "Live tracking and photo proof included"],
      },
      {
        icon: "pulse",
        name: "Same Day",
        tagline: "The everyday default",
        body: "Picked up and delivered today. The balance of speed and price most local shops run on.",
        points: ["Collected and delivered the same day", "Customer gets a live map and ETA", "Text and email updates at every step"],
      },
      {
        icon: "pin",
        name: "Direct",
        tagline: "Straight there, nothing else on board",
        body: "A courier carries your parcel and nothing else, from your counter to the door. For urgent, fragile and VIP orders.",
        points: ["Fastest option", "One parcel, one courier, one trip", "Best for flowers, cakes and urgent items"],
      },
      {
        icon: "batch",
        name: "Batch",
        tagline: "Cheapest per drop",
        body: "Send many parcels at once. We group nearby drop-offs into one optimised route, which brings the price of each delivery down.",
        points: ["Lowest price per delivery", "Upload a CSV or use the API", "Built for subscription boxes and weekly runs"],
      },
    ],
    includedTitle: "Included with every delivery",
    included: [
      { icon: "code", title: "Generated labels", body: "Print every delivery label you need in one click." },
      { icon: "pin", title: "Real-time tracking", body: "You and your customer always know where the parcel is." },
      { icon: "camera", title: "Proof of delivery", body: "A timestamped photo at the door, by default." },
      { icon: "id", title: "ID checks when needed", body: "Age-restricted orders can't be completed without one." },
    ],
    ctaTitle: "Start delivering today",
    ctaText: "Offer local delivery and bring the in-store experience to your customer's door.",
    ctaLabel: "Create a business account",
  },

  // ------------------------------------------------------------ industries
  industries: {
    eyebrow: "Industries",
    title: "Built for the shops on your street",
    subtitle: "If it fits in a car and it's legal to deliver, we can probably take it. These are the businesses we work with most.",
    items: [
      { icon: "basket", name: "Grocery", body: "Fresh, chilled and pantry orders delivered the same day, with cold-chain handling flagged to the courier before pickup.", note: "" },
      { icon: "cake", name: "Bakery", body: "Cakes and pastries travel on Direct, so nothing else is stacked on top and they arrive the way they left.", note: "" },
      { icon: "box", name: "Meal prep", body: "Weekly meal boxes go out together on Batch routes, grouped by neighbourhood to keep the price per drop low.", note: "" },
      { icon: "flower", name: "Florist", body: "Bouquets delivered upright and on time, with a photo so you can show the sender it arrived.", note: "" },
      { icon: "bag", name: "Retail", body: "Give local customers the option of delivery today instead of a trip to the store or a week in the post.", note: "" },
      { icon: "paw", name: "Pet store", body: "Food, litter and supplies delivered to the door, on a schedule or on demand.", note: "" },
      { icon: "glass", name: "Alcohol", body: "The courier checks government photo ID at the door and the delivery cannot be completed without it.", note: "ID check required · where provincial rules allow" },
      { icon: "pill", name: "Pharmacy", body: "Prescriptions handed to the right person, with ID or signature when you require it and a return to you if nobody is home.", note: "ID or signature on request" },
      { icon: "leaf", name: "Vape & tobacco", body: "Age-verified delivery with a recorded ID check for every order.", note: "ID check required · where provincial rules allow" },
    ],
    ctaTitle: "Don't see your industry?",
    ctaText: "Tell us what you send and we'll tell you honestly whether we're a good fit.",
    ctaLabel: "Talk to our team",
  },

  // ---------------------------------------------------------------- cities
  cities: {
    eyebrow: "Cities",
    title: "Where SwiftDrop delivers",
    subtitle: "We operate in Canada only. Most deliveries stay inside the city, with some routes reaching the surrounding area.",
    // Names must match the eight service cities; the map positions are fixed in code.
    items: [
      { name: "Toronto", province: "Ontario", body: "The city of Toronto and the nearby parts of the GTA." },
      { name: "Ottawa", province: "Ontario", body: "Ottawa and the surrounding communities." },
      { name: "Hamilton", province: "Ontario", body: "Hamilton and the surrounding communities." },
      { name: "Oshawa", province: "Ontario", body: "Oshawa and nearby Durham Region." },
      { name: "Vancouver", province: "British Columbia", body: "Vancouver and the nearby parts of Metro Vancouver." },
      { name: "Calgary", province: "Alberta", body: "Calgary and the area around it." },
      { name: "Edmonton", province: "Alberta", body: "Edmonton and the area around it." },
      { name: "Winnipeg", province: "Manitoba", body: "Winnipeg and the area around it." },
    ],
    note: "Not in one of these cities yet? Tell us where you are — demand decides where we open next.",
    ctaLabel: "Check prices for your address",
  },

  // ---------------------------------------------------------- how it works
  howItWorks: {
    eyebrow: "How SwiftDrop works",
    title: "From sign-up to your first delivery",
    subtitle: "Five steps. Most businesses are sending the same day they are approved.",
    steps: [
      { title: "Create your account", body: "Tell us about your business and where couriers should collect. It takes about five minutes." },
      { title: "Get verified", body: "We check every business before its first delivery — usually in less than one working day." },
      { title: "Book a delivery", body: "Enter the drop-off address, pick a service and a time window. You see the price before you confirm." },
      { title: "Pack and label", body: "Print the label, attach it to the parcel and have it ready at the pickup address." },
      { title: "We pick up and deliver", body: "A courier collects it and takes it to the door. You and your customer follow it live." },
    ],
    trackingTitle: "Tracking & notifications",
    tracking: [
      { title: "Tracking", body: "Your customer gets a link to a live tracking page by text and email. It shows the parcel from pickup to their door." },
      { title: "Notifications", body: "We tell your customer when the parcel is picked up, when the courier is close, and when it has been delivered." },
    ],
    crucialTitle: "Good to know",
    crucial: [
      { title: "Photo proof", body: "A photo is taken at the door for every delivery that doesn't need an ID check." },
      { title: "ID-checked delivery", body: "For age-restricted orders the courier records a government photo ID check in person before handing over the parcel." },
      { title: "Returns", body: "If a parcel can't legally be left unattended and nobody is there to receive it, it comes back to you." },
      { title: "Parcel size", body: "A single parcel can weigh up to 9 kg and must fit safely in an ordinary car. Several parcels can go on one delivery, each with its own label." },
    ],
    ctaTitle: "Ready when you are",
    ctaLabel: "Create a business account",
  },

  // ----------------------------------------------------------------- zones
  zones: {
    eyebrow: "Delivery zones",
    title: "See the price for your address",
    subtitle: "Prices depend on how far the parcel travels and the service you pick. Enter your pickup address to see every zone and its price.",
    note: "Zones are measured from your pickup address. Zone 1 is the closest and the lowest price; higher zones are further away. Prices are estimates before tax — the exact price is always shown before you confirm a delivery.",
    outsideText: "That address is outside our current service areas. We deliver in Calgary, Edmonton, Hamilton, Oshawa, Ottawa, Toronto, Vancouver and Winnipeg.",
  },

  // --------------------------------------------------------------- reviews
  // Real customer reviews only. Empty by default: the section stays hidden
  // on the website until you add reviews you have permission to publish.
  reviews: {
    title: "What local businesses say",
    subtitle: "",
    items: [] as { name: string; business: string; industry: string; quote: string }[],
  },

  // ----------------------------------------------------------------- terms
  terms: {
    title: "Terms of Service",
    intro: "What you need to know about using SwiftDrop.",
    updated: "November 15, 2026",
    sections: [
      {
        h: "1. About these terms",
        p: [
          "These Terms of Service are an agreement between SwiftDrop and the business or person using the SwiftDrop website, web portal and delivery services (together, the \"Service\"). By creating an account or booking a delivery you agree to them. If you do not agree, please do not use the Service.",
          "SwiftDrop operates in Canada only. These terms are governed by the laws of the province in which SwiftDrop is registered and the federal laws of Canada that apply there.",
        ],
      },
      {
        h: "2. Your account",
        p: [
          "You must give accurate information when you sign up and keep it up to date. We verify every business before its first delivery and may ask for documents to do so.",
          "You are responsible for everything done under your account. Keep your password private and tell us straight away if you think someone else has used it.",
        ],
      },
      {
        h: "3. Booking deliveries",
        p: [
          "The price of each delivery is shown before you confirm it. It is based on your pickup address, the delivery zone and the service you choose. Taxes are added where they apply.",
          "A booking is confirmed when you submit it. Delivery windows are estimates, not guarantees: traffic, weather and other things outside our control can cause delays.",
        ],
      },
      {
        h: "4. Packaging",
        p: [
          "Every parcel must be closed, labelled with its SwiftDrop label and ready at the pickup address at the start of the pickup window. A single parcel may weigh up to 9 kg and must fit safely in the trunk or back seat of an ordinary car.",
          "Perishable items must be in a sealed, insulated container suitable for the whole delivery window. Fragile items must be in a rigid outer box with cushioning on all sides. Liquids must be fully contained so they cannot leak.",
          "A courier may refuse a parcel that does not meet these rules. A cancellation fee may apply to refused parcels.",
        ],
      },
      {
        h: "5. Restricted and prohibited items",
        p: [
          "Alcohol, pharmacy items and vape or tobacco products may only be sent where the law of the province allows it and only with ID verification switched on for that order. The recipient must show valid government photo ID. If they cannot, the parcel is returned to you and a return fee applies. You are responsible for holding any licence your business needs to sell and deliver these products.",
          "You may not send anything illegal, hazardous or dangerous. This includes, without limit, explosives, flammable or toxic materials, weapons, live animals, cash and anything that needs a special permit to transport. Ask us before sending if you are not sure.",
        ],
      },
      {
        h: "6. Accurate delivery information",
        p: [
          "You are responsible for giving a complete and correct delivery address: street number, street name, unit or suite if there is one, city and postal code. We do not check addresses for you. We do not deliver to PO boxes.",
          "A phone number and an email address for the recipient are needed so the courier can reach them and so we can send tracking updates. A delivery cannot go ahead without both.",
          "If a delivery fails because the information you gave was wrong or incomplete, return or redelivery fees apply and SwiftDrop is not responsible for the resulting loss or delay.",
        ],
      },
      {
        h: "7. Delivery, proof and failed deliveries",
        p: [
          "Unless an order needs an ID check or a signature, the courier may leave the parcel at the door and take a photo as proof of delivery. That photo, with its time and location, is the record that the delivery was completed.",
          "If nobody is available for a delivery that must be handed over in person, the courier will try to contact the recipient. If that fails, the parcel is returned to you at the same rate as the original delivery.",
        ],
      },
      {
        h: "8. Cancellations and changes",
        p: [
          "You can cancel a delivery without charge until a courier has been assigned to it. After that, a cancellation fee may apply, and once the parcel has been picked up the delivery cannot be cancelled — only returned.",
        ],
      },
      {
        h: "9. Payment",
        p: [
          "You agree to pay for every delivery booked under your account, together with any fees described in these terms. Charges are billed to the payment method on your account. Unpaid amounts may lead to your account being paused.",
        ],
      },
      {
        h: "10. Lost or damaged parcels",
        p: [
          "If a parcel is lost or damaged while it is in our care, tell us within 7 days of the delivery date and include photos where you can. After we have looked into it, our responsibility is limited to the lower of the item's proven cost to you or $100 per delivery, unless a higher amount has been agreed with us in writing beforehand.",
          "We are not responsible for loss or damage caused by packaging that does not meet section 4, by incorrect information, by prohibited items, or by events outside our reasonable control.",
        ],
      },
      {
        h: "11. Using the Service fairly",
        p: [
          "Do not misuse the Service: no false bookings, no attempts to get around our systems or security, no harassment of couriers or staff, and no use of the Service for anything unlawful. Couriers are independent and must be treated with respect.",
          "We may suspend or close an account that breaks these terms, puts a courier at risk, or is used fraudulently.",
        ],
      },
      {
        h: "12. Privacy",
        p: [
          "We handle personal information as described in our Privacy page. When you give us your customers' details for a delivery, you confirm that you are allowed to share them with us for that purpose.",
        ],
      },
      {
        h: "13. Limits on our responsibility",
        p: [
          "The Service is provided as it is. To the extent the law allows, SwiftDrop is not liable for indirect or consequential losses such as lost profits or lost business, and our total liability for any one delivery is limited as set out in section 10. Nothing in these terms removes rights you have under Canadian law that cannot be excluded.",
        ],
      },
      {
        h: "14. Changes to these terms",
        p: [
          "We may update these terms from time to time. We will post the new version here and change the date at the top. If a change is significant we will tell account holders by email. Continuing to use the Service after a change means you accept the updated terms.",
        ],
      },
      {
        h: "15. Contact",
        p: [
          "Questions about these terms? Reach our support team through the Contact page on this website.",
        ],
      },
    ],
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
