/**
 * Turns a failed API response into a message a person can act on.
 *
 * Client-safe (no server imports). The sign-up forms used to show
 * "password must be at least 8 characters" for *every* failure, including
 * server errors — which sent people chasing a problem they didn't have.
 */

const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  password: "Password",
  fullName: "Full name",
  phone: "Mobile number",
  referralCode: "Referral code",
  address: "Address",
  city: "City",
  province: "Province",
  postalCode: "Postal code",
  businessName: "Business name",
  contactName: "Contact name",
  businessPhone: "Business phone",
  businessAddress: "Business address",
  businessCity: "Business city",
  dailyVolume: "Daily volume",
  vehicleType: "Vehicle",
  vehicleMakeModel: "Vehicle make & model",
  vehiclePlate: "Licence plate",
  licenseNumber: "Driver's licence number",
  licenseExpiry: "Licence expiry",
  insuranceProvider: "Insurance provider",
  insurancePolicyNumber: "Insurance policy number",
  insuranceExpiry: "Insurance expiry",
};

const FIELD_HINTS: Record<string, string> = {
  email: "enter a valid email address",
  password: "must be at least 8 characters",
  fullName: "enter your full name",
  phone: "enter a valid phone number",
  referralCode: "check the code — it looks like SWIFT-XXXX",
  address: "enter the street address",
  city: "enter your city",
  province: "pick your province",
  postalCode: "enter a postal code like M5V 2T6",
  businessName: "enter your business name",
  contactName: "enter a contact name",
  businessPhone: "enter a valid phone number",
  businessAddress: "enter the full business address",
  businessCity: "enter the city the business operates in",
  dailyVolume: "pick the option closest to your daily volume",
  vehicleType: "pick a vehicle",
  vehicleMakeModel: "enter the make and model",
  vehiclePlate: "enter the licence plate",
  licenseNumber: "enter your driver's licence number",
  licenseExpiry: "enter the licence expiry date",
  insuranceProvider: "enter the insurance provider",
  insurancePolicyNumber: "enter the policy number",
  insuranceExpiry: "enter the insurance expiry date",
};

export function apiErrorMessage(status: number, data: any): string {
  const err = data?.error;
  if (typeof err === "string" && err.trim()) return err;

  // zod's `.flatten()` shape: { formErrors: string[], fieldErrors: { field: string[] } }
  const fieldErrors = err?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const parts = Object.keys(fieldErrors)
      .filter((k) => Array.isArray(fieldErrors[k]) && fieldErrors[k].length)
      .map((k) => `${FIELD_LABELS[k] ?? k} — ${FIELD_HINTS[k] ?? String(fieldErrors[k][0]).toLowerCase()}`);
    if (parts.length) return `Please check: ${parts.join("; ")}.`;
  }

  if (status === 429) return "Too many attempts — please wait a little and try again.";
  if (status >= 500) return "Something went wrong on our side — your details are fine. Please try again in a moment.";
  return "Please check the form and try again.";
}

/**
 * Pulls per-field messages out of a zod `.flatten()` error payload so the
 * forms can put each one under its own input, instead of one blob at the
 * bottom. Returns {} for any other error shape.
 */
export function apiFieldErrors(data: any): Record<string, string> {
  const fieldErrors = data?.error?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fieldErrors)) {
    if (Array.isArray(v) && v.length) {
      out[k] = `${FIELD_LABELS[k] ?? k} — ${FIELD_HINTS[k] ?? String(v[0]).toLowerCase()}`;
    }
  }
  return out;
}

export const NETWORK_ERROR_MESSAGE = "Couldn't reach the server. Check your connection and try again.";
