import type { SectionKey } from "./defaults";

/**
 * Describes every editable section for the admin editor: which fields it
 * has, what they are called in plain English, and what hint to show under
 * them. The same description is used on the server to clean whatever the
 * editor sends back (see sanitizeSection in content.ts), so a field that is
 * not listed here can never be saved.
 */

export type Field =
  | { type: "heading"; label: string; hint?: string }
  | {
      type: "text" | "textarea" | "link" | "toggle" | "image" | "date" | "number" | "lines";
      name: string;
      label: string;
      hint?: string;
      max?: number;
    }
  | { type: "select"; name: string; label: string; hint?: string; options: { value: string; label: string }[] }
  | {
      type: "list";
      name: string;
      label: string;
      hint?: string;
      /** Singular name for one entry, used on buttons ("Add question"). */
      item: string;
      /** Field whose value is shown as the row title when collapsed. */
      titleField: string;
      /** true = entries can be edited but not added, removed, hidden or re-ordered. */
      fixed?: boolean;
      fields: Field[];
    };

export interface SectionDef {
  key: SectionKey;
  title: string;
  /** One line telling a non-technical person what this screen controls. */
  about: string;
  /** Where to look on the website after publishing. */
  preview?: string;
  group: "Pages" | "Site-wide" | "Marketing tools" | "Settings";
  fields: Field[];
}

const ICONS = [
  { value: "pin", label: "Map pin" },
  { value: "dollar", label: "Dollar sign" },
  { value: "batch", label: "Route lines" },
  { value: "camera", label: "Camera" },
  { value: "code", label: "Code brackets" },
  { value: "pulse", label: "Pulse line" },
  { value: "route", label: "Winding route" },
  { value: "return", label: "Return arrow" },
  { value: "id", label: "ID card" },
  { value: "snow", label: "Snowflake" },
  { value: "alert", label: "Warning triangle" },
  { value: "nocut", label: "Circle with line" },
  { value: "wallet", label: "Bank card" },
  { value: "calendar", label: "Calendar tick" },
];

const iconField: Field = { type: "select", name: "icon", label: "Icon", options: ICONS };

const cardFields: Field[] = [
  iconField,
  { type: "text", name: "title", label: "Title", max: 120 },
  { type: "textarea", name: "body", label: "Text", max: 600 },
];

const statFields: Field[] = [
  { type: "text", name: "value", label: "Number", hint: "Keep it short, e.g. 97% or 4.9★", max: 20 },
  { type: "text", name: "label", label: "What it means", max: 80 },
];

export const SECTIONS: SectionDef[] = [
  {
    key: "home",
    title: "Homepage",
    about: "Everything on the first page of the website, from the big headline down to the last button.",
    preview: "/",
    group: "Pages",
    fields: [
      { type: "heading", label: "Top of the page (hero)" },
      { type: "text", name: "heroBadge", label: "Small label above the headline", max: 80 },
      { type: "text", name: "heroLine1", label: "Headline — first line", max: 80 },
      { type: "text", name: "heroLine2", label: "Headline — second line (coloured)", max: 80 },
      { type: "textarea", name: "heroText", label: "Text under the headline", max: 400 },
      { type: "text", name: "heroPrimaryLabel", label: "Main button text", max: 40 },
      { type: "link", name: "heroPrimaryHref", label: "Main button link" },
      { type: "text", name: "heroSecondaryLabel", label: "Second button text", max: 40 },
      { type: "link", name: "heroSecondaryHref", label: "Second button link" },
      { type: "lines", name: "heroChecks", label: "Tick points under the buttons", hint: "One per line." },
      { type: "heading", label: "Numbers strip" },
      { type: "list", name: "stats", label: "Numbers", item: "number", titleField: "label", fields: statFields },
      { type: "heading", label: "How it works" },
      { type: "text", name: "howEyebrow", label: "Small label", max: 60 },
      { type: "text", name: "howTitle", label: "Heading", max: 140 },
      { type: "textarea", name: "howSubtitle", label: "Text under the heading", max: 300 },
      {
        type: "list",
        name: "steps",
        label: "Steps",
        item: "step",
        titleField: "title",
        fields: [
          { type: "text", name: "n", label: "Step number", max: 6 },
          { type: "text", name: "title", label: "Title", max: 100 },
          { type: "textarea", name: "body", label: "Text", max: 500 },
        ],
      },
      { type: "heading", label: "Feature cards" },
      { type: "text", name: "featEyebrow", label: "Small label", max: 60 },
      { type: "text", name: "featTitle", label: "Heading", max: 140 },
      { type: "textarea", name: "featSubtitle", label: "Text under the heading", max: 400 },
      { type: "text", name: "featWideTitle", label: "Wide card — title", max: 100 },
      { type: "textarea", name: "featWideBody", label: "Wide card — text", max: 600 },
      { type: "text", name: "featTallTitle", label: "Pricing card — title", max: 100 },
      { type: "textarea", name: "featTallBody", label: "Pricing card — text", max: 600 },
      { type: "text", name: "featTallLinkLabel", label: "Pricing card — link text", max: 60 },
      { type: "list", name: "featCards", label: "Small cards", item: "card", titleField: "title", fields: cardFields },
      { type: "heading", label: "Dashboard picture" },
      { type: "text", name: "shotEyebrow", label: "Small label", max: 60 },
      { type: "text", name: "shotTitle", label: "Heading", max: 140 },
      { type: "textarea", name: "shotSubtitle", label: "Text under the heading", max: 300 },
      { type: "text", name: "shotButtonLabel", label: "Button text", max: 40 },
      { type: "heading", label: "Cities" },
      { type: "text", name: "coverageTitle", label: "Heading", max: 80 },
      { type: "lines", name: "cities", label: "Cities in the moving strip", hint: "One city per line." },
      { type: "heading", label: "Courier box" },
      { type: "text", name: "courierEyebrow", label: "Small label", max: 60 },
      { type: "text", name: "courierTitle", label: "Heading", max: 140 },
      { type: "textarea", name: "courierText", label: "Text", max: 400 },
      { type: "text", name: "courierPrimaryLabel", label: "Main button text", max: 40 },
      { type: "text", name: "courierSecondaryLabel", label: "Second button text", max: 40 },
      { type: "list", name: "courierStats", label: "Numbers", item: "number", titleField: "label", fields: statFields },
      { type: "heading", label: "Questions heading", hint: "The questions themselves are edited under “Questions (FAQ)”." },
      { type: "text", name: "faqEyebrow", label: "Small label", max: 60 },
      { type: "text", name: "faqTitle", label: "Heading", max: 100 },
      { type: "heading", label: "Bottom of the page" },
      { type: "text", name: "ctaTitle", label: "Heading", max: 140 },
      { type: "textarea", name: "ctaText", label: "Text", max: 300 },
      { type: "text", name: "ctaPrimaryLabel", label: "Main button text", max: 40 },
      { type: "link", name: "ctaPrimaryHref", label: "Main button link" },
      { type: "text", name: "ctaSecondaryLabel", label: "Second button text", max: 40 },
      { type: "link", name: "ctaSecondaryHref", label: "Second button link" },
    ],
  },
  {
    key: "features",
    title: "Features page",
    about: "The page that walks a business through what the platform does.",
    preview: "/features",
    group: "Pages",
    fields: [
      { type: "heading", label: "Top of the page" },
      { type: "text", name: "heroEyebrow", label: "Small label", max: 60 },
      { type: "text", name: "heroTitle", label: "Heading", max: 140 },
      { type: "textarea", name: "heroSubtitle", label: "Text under the heading", max: 300 },
      { type: "heading", label: "Big blocks with screenshots" },
      {
        type: "list",
        name: "blocks",
        label: "Blocks",
        hint: "Each block sits next to a fixed screenshot, so the order can't be changed here.",
        item: "block",
        titleField: "title",
        fixed: true,
        fields: [
          { type: "text", name: "eyebrow", label: "Small label", max: 60 },
          { type: "text", name: "title", label: "Heading", max: 140 },
          { type: "textarea", name: "body", label: "Text", max: 800 },
          { type: "lines", name: "points", label: "Tick points", hint: "One per line." },
        ],
      },
      { type: "heading", label: "Courier block" },
      { type: "text", name: "courierEyebrow", label: "Small label", max: 60 },
      { type: "text", name: "courierTitle", label: "Heading", max: 140 },
      { type: "textarea", name: "courierText", label: "Text", max: 800 },
      { type: "text", name: "courierButtonLabel", label: "Button text", max: 40 },
      { type: "heading", label: "Grid of smaller features" },
      { type: "text", name: "gridTitle", label: "Heading", max: 100 },
      { type: "text", name: "gridSubtitle", label: "Text under the heading", max: 200 },
      { type: "list", name: "grid", label: "Feature cards", item: "card", titleField: "title", fields: cardFields },
      { type: "heading", label: "Bottom of the page" },
      { type: "text", name: "ctaTitle", label: "Heading", max: 140 },
      { type: "textarea", name: "ctaText", label: "Text", max: 300 },
      { type: "text", name: "ctaPrimaryLabel", label: "Main button text", max: 40 },
      { type: "text", name: "ctaSecondaryLabel", label: "Second button text", max: 40 },
    ],
  },
  {
    key: "pricing",
    title: "Pricing page",
    about:
      "Wording on the pricing page. The actual prices come from “Zones & pricing” in the Accounts menu, so they always match what customers are charged.",
    preview: "/pricing",
    group: "Pages",
    fields: [
      { type: "heading", label: "Top of the page" },
      { type: "text", name: "heroEyebrow", label: "Small label", max: 60 },
      { type: "text", name: "heroTitle", label: "Heading", max: 140 },
      { type: "textarea", name: "heroSubtitle", label: "Text under the heading", max: 400 },
      { type: "heading", label: "Service cards" },
      {
        type: "list",
        name: "services",
        label: "Services",
        hint: "Four fixed services, in this order: Batch, Next Day, Same Day, Direct.",
        item: "service",
        titleField: "name",
        fixed: true,
        fields: [
          { type: "text", name: "name", label: "Name", max: 40 },
          { type: "text", name: "tagline", label: "Small line above the name", max: 60 },
          { type: "textarea", name: "body", label: "Description", max: 400 },
          { type: "text", name: "best", label: "Best for", max: 80 },
        ],
      },
      { type: "text", name: "popularLabel", label: "Badge on the Same Day card", max: 30 },
      { type: "heading", label: "Zone rates table" },
      { type: "text", name: "zonesTitle", label: "Heading", max: 100 },
      { type: "textarea", name: "zonesSubtitle", label: "Text under the heading", max: 300 },
      { type: "textarea", name: "zonesNote", label: "Small print under the table", max: 600 },
      { type: "heading", label: "What's included" },
      { type: "text", name: "includedTitle", label: "Heading", max: 100 },
      { type: "text", name: "includedSubtitle", label: "Text under the heading", max: 200 },
      { type: "lines", name: "included", label: "Included items", hint: "One per line." },
      { type: "text", name: "ctaPrimaryLabel", label: "Main button text", max: 40 },
      { type: "text", name: "ctaSecondaryLabel", label: "Second button text", max: 40 },
    ],
  },
  {
    key: "couriers",
    title: "Drive with us page",
    about: "The page that invites couriers to apply.",
    preview: "/couriers",
    group: "Pages",
    fields: [
      { type: "heading", label: "Top of the page" },
      { type: "text", name: "heroEyebrow", label: "Small label", max: 60 },
      { type: "text", name: "heroLine1", label: "Headline — first line", max: 80 },
      { type: "text", name: "heroLine2", label: "Headline — second line (coloured)", max: 80 },
      { type: "textarea", name: "heroText", label: "Text under the headline", max: 400 },
      { type: "text", name: "heroPrimaryLabel", label: "Main button text", max: 40 },
      { type: "text", name: "heroSecondaryLabel", label: "Second button text", max: 40 },
      { type: "text", name: "heroNote", label: "Small note under the buttons", max: 200 },
      { type: "heading", label: "Reasons to drive" },
      { type: "list", name: "why", label: "Cards", item: "card", titleField: "title", fields: cardFields },
      { type: "heading", label: "Tiers" },
      { type: "text", name: "tiersEyebrow", label: "Small label", max: 60 },
      { type: "text", name: "tiersTitle", label: "Heading", max: 140 },
      { type: "textarea", name: "tiersSubtitle", label: "Text under the heading", max: 300 },
      {
        type: "list",
        name: "tiers",
        label: "Tiers",
        item: "tier",
        titleField: "name",
        fields: [
          { type: "text", name: "name", label: "Tier name", max: 30 },
          { type: "text", name: "bonus", label: "Bonus per delivery", hint: "Use — if there is no bonus.", max: 12 },
          { type: "text", name: "requirement", label: "How to reach it", max: 140 },
          { type: "lines", name: "perks", label: "Perks", hint: "One per line." },
          { type: "toggle", name: "featured", label: "Highlight this tier" },
        ],
      },
      { type: "heading", label: "Requirements" },
      { type: "text", name: "reqTitle", label: "Heading", max: 100 },
      { type: "text", name: "reqEveryoneLabel", label: "First list — title", max: 60 },
      { type: "lines", name: "reqEveryone", label: "First list — items", hint: "One per line." },
      { type: "text", name: "reqVehicleLabel", label: "Second list — title", max: 60 },
      { type: "lines", name: "reqVehicle", label: "Second list — items", hint: "One per line." },
      { type: "textarea", name: "reqNote", label: "Yellow notice", max: 400 },
      { type: "heading", label: "Apply box" },
      { type: "text", name: "applyTitle", label: "Heading", max: 100 },
      { type: "textarea", name: "applyText", label: "Text", max: 400 },
      { type: "text", name: "applyButtonLabel", label: "Button text", max: 40 },
    ],
  },
  {
    key: "faq",
    title: "Questions (FAQ)",
    about: "The questions and answers shown on the homepage.",
    preview: "/",
    group: "Pages",
    fields: [
      {
        type: "list",
        name: "items",
        label: "Questions",
        item: "question",
        titleField: "q",
        fields: [
          { type: "text", name: "q", label: "Question", max: 200 },
          { type: "textarea", name: "a", label: "Answer", max: 1500 },
        ],
      },
    ],
  },
  {
    key: "contact",
    title: "Contact page",
    about: "The wording on the contact page and the choices in its “What is this about?” list.",
    preview: "/contact",
    group: "Pages",
    fields: [
      { type: "text", name: "eyebrow", label: "Small label", max: 60 },
      { type: "text", name: "title", label: "Heading", max: 100 },
      { type: "textarea", name: "intro", label: "Text under the heading", max: 400 },
      { type: "lines", name: "types", label: "Enquiry types", hint: "One per line. Visitors choose one of these." },
      { type: "text", name: "buttonLabel", label: "Button text", max: 40 },
      { type: "text", name: "successTitle", label: "Thank-you heading", max: 100 },
      { type: "textarea", name: "successText", label: "Thank-you text", max: 300 },
    ],
  },
  {
    key: "privacy",
    title: "Privacy page",
    about: "Your privacy notice. Have a lawyer check any change before you publish it.",
    preview: "/privacy",
    group: "Pages",
    fields: [
      { type: "text", name: "title", label: "Heading", max: 100 },
      { type: "textarea", name: "intro", label: "Text under the heading", max: 300 },
      {
        type: "list",
        name: "sections",
        label: "Sections",
        item: "section",
        titleField: "h",
        fields: [
          { type: "text", name: "h", label: "Section heading", max: 140 },
          { type: "lines", name: "p", label: "Paragraphs", hint: "One paragraph per line.", max: 2000 },
        ],
      },
    ],
  },
  {
    key: "site",
    title: "Menu, footer & contact details",
    about: "Things that appear on every page: the top menu, the footer, and how people can reach you.",
    preview: "/",
    group: "Site-wide",
    fields: [
      { type: "heading", label: "Top menu" },
      {
        type: "list",
        name: "navLinks",
        label: "Menu links",
        item: "link",
        titleField: "label",
        fields: [
          { type: "text", name: "label", label: "Text", max: 40 },
          { type: "link", name: "href", label: "Link" },
        ],
      },
      { type: "text", name: "navSignInLabel", label: "Sign-in link text", max: 30 },
      { type: "text", name: "navCtaLabel", label: "Menu button text", max: 30 },
      { type: "toggle", name: "showContactLink", label: "Show a “Contact” link in the footer", hint: "Turn this on once you are ready to receive enquiries." },
      { type: "heading", label: "Footer" },
      { type: "textarea", name: "footerText", label: "Short description under the logo", max: 300 },
      { type: "text", name: "footerStatus", label: "Status line (with the green dot)", max: 60 },
      { type: "text", name: "footerCopyright", label: "Copyright line", hint: "The year is added automatically.", max: 140 },
      { type: "heading", label: "Contact details", hint: "Leave any of these empty and it simply won't be shown." },
      { type: "text", name: "phone", label: "Phone number", hint: "Include the country code, e.g. +1 416 555 0100", max: 30 },
      { type: "text", name: "whatsapp", label: "WhatsApp number", hint: "Include the country code. Digits only is safest.", max: 30 },
      { type: "text", name: "email", label: "Email address", max: 120 },
      { type: "textarea", name: "address", label: "Address", max: 240 },
      { type: "link", name: "mapLink", label: "Map link", hint: "Paste the Google Maps share link." },
      { type: "text", name: "hours", label: "Opening hours", hint: "e.g. Mon–Fri 9am–6pm ET", max: 120 },
      { type: "heading", label: "Social media", hint: "Paste the full link to each profile." },
      { type: "link", name: "facebook", label: "Facebook" },
      { type: "link", name: "instagram", label: "Instagram" },
      { type: "link", name: "x", label: "X (Twitter)" },
      { type: "link", name: "linkedin", label: "LinkedIn" },
      { type: "link", name: "tiktok", label: "TikTok" },
      { type: "link", name: "youtube", label: "YouTube" },
    ],
  },
  {
    key: "announcement",
    title: "Announcement bar",
    about: "A thin coloured bar at the very top of every public page — good for news, offers or service notices.",
    preview: "/",
    group: "Marketing tools",
    fields: [
      { type: "toggle", name: "enabled", label: "Show the announcement bar" },
      { type: "text", name: "text", label: "Message", max: 160 },
      { type: "text", name: "linkLabel", label: "Button text (optional)", max: 30 },
      { type: "link", name: "linkHref", label: "Button link (optional)" },
      {
        type: "select",
        name: "color",
        label: "Colour",
        options: [
          { value: "blue", label: "Brand blue" },
          { value: "dark", label: "Dark" },
          { value: "green", label: "Green" },
          { value: "amber", label: "Amber (warning)" },
        ],
      },
      { type: "date", name: "startDate", label: "Start showing on (optional)" },
      { type: "date", name: "endDate", label: "Stop showing after (optional)", hint: "The bar disappears by itself after this day." },
    ],
  },
  {
    key: "popup",
    title: "Popup",
    about: "A small box that appears over the page once a visitor has been there a few seconds.",
    preview: "/",
    group: "Marketing tools",
    fields: [
      { type: "toggle", name: "enabled", label: "Show the popup" },
      { type: "text", name: "title", label: "Heading", max: 100 },
      { type: "textarea", name: "text", label: "Text", max: 400 },
      { type: "image", name: "image", label: "Picture (optional)" },
      { type: "text", name: "buttonLabel", label: "Button text", max: 30 },
      { type: "link", name: "buttonHref", label: "Button link" },
      {
        type: "select",
        name: "pages",
        label: "Show on",
        options: [
          { value: "all", label: "Every public page" },
          { value: "/", label: "Homepage only" },
          { value: "/features", label: "Features page only" },
          { value: "/pricing", label: "Pricing page only" },
          { value: "/couriers", label: "Drive with us page only" },
        ],
      },
      {
        type: "select",
        name: "frequency",
        label: "How often one visitor sees it",
        options: [
          { value: "once", label: "Only once" },
          { value: "daily", label: "Once a day" },
          { value: "always", label: "Every visit" },
        ],
      },
      { type: "number", name: "delaySeconds", label: "Wait this many seconds before showing" },
      { type: "date", name: "startDate", label: "Start showing on (optional)" },
      { type: "date", name: "endDate", label: "Stop showing after (optional)" },
    ],
  },
  {
    key: "seo",
    title: "Google & sharing",
    about:
      "The title and description Google shows for each page, and the picture that appears when someone shares a link on WhatsApp or Facebook.",
    group: "Marketing tools",
    fields: (
      [
        ["home", "Homepage"],
        ["features", "Features page"],
        ["pricing", "Pricing page"],
        ["couriers", "Drive with us page"],
        ["contact", "Contact page"],
        ["privacy", "Privacy page"],
      ] as const
    ).flatMap(([k, label]): Field[] => [
      { type: "heading", label },
      { type: "text", name: `${k}Title`, label: "Title", hint: "Best under 60 characters.", max: 120 },
      { type: "textarea", name: `${k}Description`, label: "Description", hint: "Best under 160 characters.", max: 320 },
      { type: "image", name: `${k}Image`, label: "Share picture (optional)", hint: "A wide picture works best (1200 × 630)." },
    ]),
  },
  {
    key: "alerts",
    title: "Email alerts",
    about: "Get an email every time someone sends the contact form.",
    group: "Settings",
    fields: [
      { type: "toggle", name: "enabled", label: "Send an email for every new enquiry" },
      { type: "lines", name: "recipients", label: "Send to", hint: "One email address per line. Press Publish to apply." },
    ],
  },
];

export function sectionDef(key: string): SectionDef | undefined {
  return SECTIONS.find((s) => s.key === key);
}
