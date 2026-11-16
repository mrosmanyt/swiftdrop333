/**
 * Photographs used on the public site.
 *
 * To add or replace one: put the file in /public/images/ and write its path
 * here (for example "/images/home-hero.webp"). An empty string means "no
 * photo yet" — the section then shows its designed fallback instead of a
 * broken image, so the site always looks finished.
 *
 * Recommended sizes are in /public/images/README.md.
 */
export const SITE_IMAGES = {
  // ── Homepage ──────────────────────────────────────────────
  /** Hero background. Landscape 16:9. */
  homeHero: "/images/home-hero.webp",
  /** "How it works" step photos, in step order. Landscape. */
  stepBook: "/images/step-book.webp",
  stepDispatch: "/images/step-dispatch.webp",
  stepWatch: "/images/step-watch.webp",
  /** Wide "live tracking" feature card. */
  tracking: "/images/tracking.webp",
  /** Tall "published flat rates" card. */
  pricingCard: "/images/cafe-owner.webp",
  /** Small feature cards, matched by their icon (batch, camera, code). */
  featBatch: "/images/batch-trunk.webp",
  featProof: "/images/photo-proof.webp",
  featApi: "/images/api-desk.webp",
  /** Background of the "Delivering across Canada" band. Wide. */
  coverage: "/images/toronto-skyline.webp",
  /** Courier section on the homepage. */
  courier: "/images/courier.webp",

  // ── Other pages ───────────────────────────────────────────
  /** Wide band under the Features page heading. */
  featuresBand: "/images/route-night.webp",
  /** Products page cards, matched by their icon (calendar, pulse, pin, batch). */
  productNextDay: "/images/bakery-pickup.webp",
  productSameDay: "/images/courier-city.webp",
  productDirect: "/images/direct-cake.webp",
  productBatch: "/images/batch-trunk.webp",
  /** Industries page cards, matched by their icon. */
  industryGrocery: "/images/industry-grocery.webp",
  industryBakery: "/images/industry-bakery.webp",
  industryMealPrep: "/images/industry-meal-prep-2.webp",
  industryFlorist: "/images/industry-florist-2.webp",
  industryRetail: "/images/industry-retail.webp",
  industryPet: "/images/industry-pet.webp",
  industryAlcohol: "/images/industry-alcohol.webp",
  industryPharmacy: "/images/industry-pharmacy.webp",
  industryVape: "/images/industry-vape.webp",
  /** How it works page, one photo per step, in step order. */
  howSignup: "/images/how-signup.webp",
  howApproved: "/images/how-approved.webp",
  howBook: "/images/step-book.webp",
  howLabel: "/images/how-label.webp",
  howDeliver: "/images/how-deliver.webp",
  /** Cities page cards, matched by city name. */
  cityToronto: "/images/city-toronto.webp",
  cityOttawa: "/images/city-ottawa.webp",
  cityHamilton: "/images/city-hamilton.webp",
  cityOshawa: "/images/city-oshawa.webp",
  cityVancouver: "/images/city-vancouver.webp",
  cityCalgary: "/images/city-calgary.webp",
  cityEdmonton: "/images/city-edmonton.webp",
  cityWinnipeg: "/images/city-winnipeg.webp",
  /** Couriers page hero, behind the sample offer card. */
  couriersHero: "/images/courier-trunk.webp",
  /** Courier page "why drive" cards, matched by icon (dollar, wallet, calendar). */
  courierWhy72: "/images/courier-72.webp",
  courierWhyCashout: "/images/courier-cashout.webp",
  courierWhyPay: "/images/courier-pay-check.webp",
  /** Couriers page, above the tier cards. Wide. */
  courierTeam: "/images/courier-team.webp",
  /** Wide band under the Pricing page heading. */
  pricingBand: "/images/pricing-parcels.webp",
  /** Band above the Zones price calculator. */
  zonesBand: "/images/zones-aerial.webp",

  // ── Sign-in / sign-up side panel (shown portrait) ─────────
  /** Default, used when a page doesn't pick its own. */
  authSide: "/images/courier-city.webp",
  authLogin: "/images/auth-login.webp",
  authJoin: "/images/auth-merchant.webp",
  authCourier: "/images/auth-courier.webp",
  authCustomer: "/images/auth-customer.webp",
} as const;

export type SiteImageKey = keyof typeof SITE_IMAGES;

/**
 * Picture shown when a page is shared on WhatsApp, Facebook, X, LinkedIn…
 * 1200×630 JPG. A page's own share picture from Website → Google & sharing
 * takes priority over this one.
 */
export const SHARE_IMAGE = "/images/og-share.jpg";
