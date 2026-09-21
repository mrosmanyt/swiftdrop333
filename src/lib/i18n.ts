/**
 * Bilingual support (English / French), extensible to more languages.
 *
 * Why this matters here and isn't optional: Quebec's language rules
 * require consumer-facing communication to be available in French, so the
 * customer tracking page and the notifications a customer receives are
 * translated. Internal staff screens stay English-first for now — add
 * keys below and they'll pick up automatically.
 *
 * Locale resolution order: explicit ?lang= → signed-in user's saved
 * preference → Accept-Language header → English.
 */

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

type Dict = Record<string, string>;

const en: Dict = {
  "track.title": "Track your delivery",
  "track.deliveryTo": "Delivery to",
  "track.status.PENDING": "Order placed",
  "track.status.ASSIGNED": "Courier assigned",
  "track.status.PICKED_UP": "Picked up",
  "track.status.IN_TRANSIT": "In transit",
  "track.status.DELIVERED": "Delivered",
  "track.status.FAILED": "Delivery failed",
  "track.status.RETURNING": "Returning to sender",
  "track.status.RETURNED": "Returned to sender",
  "track.status.CANCELLED": "Cancelled",
  "track.eta": "Estimated arrival",
  "track.minutes": "min",
  "track.waitingForCourier": "Waiting for your courier's location…",
  "track.courierOn": "Your courier is on a",
  "track.proofOfDelivery": "Proof of delivery",
  "track.rate.question": "How was your delivery?",
  "track.rate.comment": "Optional comment",
  "track.rate.submit": "Submit",
  "track.rate.thanks": "Thanks for the feedback!",
  "track.rated": "You rated this delivery",
  "track.notFound": "Delivery not found",
  "track.ageVerification": "Photo ID will be checked on delivery (age-restricted item).",
  "track.temperature.cold": "Kept refrigerated in transit",
  "track.temperature.frozen": "Kept frozen in transit",
  "chat.title": "Messages",
  "chat.privacy": "Phone numbers stay private — chat here instead.",
  "chat.placeholder": "Type a message…",
  "chat.send": "Send",
  "chat.empty": "No messages yet.",
  "support.title": "Need help?",
  "support.subject": "Subject",
  "support.message": "What's going on?",
  "support.email": "Your email",
  "support.submit": "Send to support",
  "support.sent": "Thanks — our team will get back to you.",
};

const fr: Dict = {
  "track.title": "Suivez votre livraison",
  "track.deliveryTo": "Livraison à",
  "track.status.PENDING": "Commande enregistrée",
  "track.status.ASSIGNED": "Livreur assigné",
  "track.status.PICKED_UP": "Colis récupéré",
  "track.status.IN_TRANSIT": "En route",
  "track.status.DELIVERED": "Livré",
  "track.status.FAILED": "Échec de la livraison",
  "track.status.RETURNING": "Retour à l'expéditeur",
  "track.status.RETURNED": "Retourné à l'expéditeur",
  "track.status.CANCELLED": "Annulé",
  "track.eta": "Arrivée estimée",
  "track.minutes": "min",
  "track.waitingForCourier": "En attente de la position de votre livreur…",
  "track.courierOn": "Votre livreur se déplace en",
  "track.proofOfDelivery": "Preuve de livraison",
  "track.rate.question": "Comment s'est passée votre livraison ?",
  "track.rate.comment": "Commentaire (facultatif)",
  "track.rate.submit": "Envoyer",
  "track.rate.thanks": "Merci pour votre retour !",
  "track.rated": "Vous avez évalué cette livraison",
  "track.notFound": "Livraison introuvable",
  "track.ageVerification": "Une pièce d'identité sera exigée à la livraison (produit à accès restreint).",
  "track.temperature.cold": "Maintenu réfrigéré pendant le transport",
  "track.temperature.frozen": "Maintenu congelé pendant le transport",
  "chat.title": "Messages",
  "chat.privacy": "Les numéros de téléphone restent privés — écrivez ici.",
  "chat.placeholder": "Écrivez un message…",
  "chat.send": "Envoyer",
  "chat.empty": "Aucun message pour le moment.",
  "support.title": "Besoin d'aide ?",
  "support.subject": "Sujet",
  "support.message": "Que se passe-t-il ?",
  "support.email": "Votre courriel",
  "support.submit": "Envoyer au soutien",
  "support.sent": "Merci — notre équipe vous répondra.",
};

const DICTS: Record<Locale, Dict> = { en, fr };

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Pick a locale from an Accept-Language header. */
export function localeFromHeader(header: string | null): Locale {
  if (!header) return "en";
  const first = header.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return isLocale(first) ? first : "en";
}

export function t(locale: Locale, key: string, fallback?: string): string {
  return DICTS[locale]?.[key] ?? DICTS.en[key] ?? fallback ?? key;
}

/** Bound translator, so components can call `tr("track.title")`. */
export function translator(locale: Locale) {
  return (key: string, fallback?: string) => t(locale, key, fallback);
}

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};
