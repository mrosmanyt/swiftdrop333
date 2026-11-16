"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { signIn } from "next-auth/react";
import AuthShell from "@/components/AuthShell";
import { apiErrorMessage, apiFieldErrors, NETWORK_ERROR_MESSAGE } from "@/lib/formErrors";
import {
  Field,
  FieldRow,
  FormAlert,
  PasswordField,
  PhoneField,
  Section,
  SelectField,
  StartOver,
  SubmitButton,
} from "@/components/signup/fields";
import { inputClass } from "@/components/signup/fields";
import { useDraftAutosave } from "@/components/signup/useDraftAutosave";
import AddressSearch, { type AddressPick } from "@/components/maps/AddressSearch";
import PinMap from "@/components/maps/PinMap";
import { PROVINCES, SERVICE_CITIES, formatPostalCode, provinceCode, serviceCityFor } from "@/lib/site/canada";

const INDUSTRIES = [
  "Grocery",
  "Bakery",
  "Meal prep",
  "Florist",
  "Retail",
  "Pet store",
  "Alcohol",
  "Pharmacy",
  "Vape & tobacco",
  "Other",
].map((v) => ({ value: v, label: v }));

const HEARD = [
  "Google search",
  "Social media",
  "Another business told me",
  "A courier told me",
  "News or blog",
  "Other",
].map((v) => ({ value: v, label: v }));

const PATTERNS = [
  { value: "on-demand", title: "As orders come in", text: "One-off deliveries through the day" },
  { value: "scheduled", title: "Many at once, on set days", text: "Orders build up, then go out together" },
  { value: "mixed", title: "A mix of both", text: "Some right away, some in batches" },
];

const VOLUMES = [
  { value: "1-10", label: "1–10 parcels a day" },
  { value: "11-50", label: "11–50 parcels a day" },
  { value: "51-200", label: "51–200 parcels a day" },
  { value: "200+", label: "More than 200 parcels a day" },
];

export default function MerchantSignupPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  // Map pin for the pickup address (set when a suggestion is picked).
  const [point, setPoint] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [areaNote, setAreaNote] = useState<string | null>(null);

  /** Fills city / province / postal code from the picked address and drops the map pin. */
  function pickAddress(pick: AddressPick) {
    const form = formRef.current;
    const set = (name: string, value: string | undefined) => {
      const el = form?.elements.namedItem(name);
      if (value && (el instanceof HTMLInputElement || el instanceof HTMLSelectElement)) el.value = value;
    };
    set("businessCity", pick.city);
    set("businessProvince", provinceCode(pick.state));
    set("businessPostalCode", pick.postcode ? formatPostalCode(pick.postcode) : undefined);
    setPoint({ lat: pick.lat, lng: pick.lng, label: pick.street || pick.label });
    const city = serviceCityFor(pick.lat, pick.lng);
    setAreaNote(
      city
        ? `Good news — this address is in our ${city.name} service area.`
        : "This address is outside our current service areas. You can still apply and we will tell you when we reach you."
    );
  }

  useDraftAutosave("merchant-signup", formRef);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setConfirmError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setConfirmError("Passwords don't match.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));

    setBusy(true);
    let res: Response;
    try {
      res = await fetch("/api/signup/merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          businessName: form.get("businessName"),
          contactName: form.get("contactName"),
          businessPhone: form.get("businessPhone"),
          businessAddress: form.get("businessAddress"),
          businessCity: form.get("businessCity"),
          businessUnit: form.get("businessUnit") || undefined,
          businessProvince: form.get("businessProvince"),
          businessPostalCode: form.get("businessPostalCode"),
          businessLat: point?.lat ?? null,
          businessLng: point?.lng ?? null,
          industry: form.get("industry"),
          referralSource: form.get("referralSource") || undefined,
          deliveryPattern: form.get("deliveryPattern"),
          signupNotes: form.get("signupNotes") || undefined,
          acceptTerms: form.get("acceptTerms") === "on",
          businessNumber: form.get("businessNumber") || undefined,
          dailyVolume: form.get("dailyVolume") || undefined,
          website: form.get("website") || undefined,
        }),
      });
    } catch {
      setBusy(false);
      setError(NETWORK_ERROR_MESSAGE);
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setBusy(false);
      setFieldErrors(apiFieldErrors(data));
      setError(apiErrorMessage(res.status, data));
      return;
    }

    clearDraft("merchant-signup");

    // The account exists now — sign them straight in. If that step fails for
    // any reason, send them to the sign-in page instead of a protected page
    // that would just bounce them.
    const signedIn = await signIn("credentials", { email, password, redirect: false }).catch(() => null);
    window.location.href = signedIn && !signedIn.error ? "/merchant/dashboard" : "/login?created=1";
  }

  function resetForm() {
    formRef.current?.reset();
    setPassword("");
    setConfirm("");
    setError(null);
    setFieldErrors({});
    setConfirmError(null);
    setPoint(null);
    setAreaNote(null);
    clearDraft("merchant-signup");
  }

  const fe = (k: string) => fieldErrors[k] ?? null;

  return (
    <AuthShell
      title="Become a SwiftDrop merchant"
      subtitle="We verify every business before the first delivery. It usually takes less than a working day."
      width="xl"
      bare
      footer={
        <>
          Already a merchant?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>{" "}
          · Want to deliver instead?{" "}
          <Link href="/signup/courier" className="text-accent hover:underline">
            Apply as a courier
          </Link>
        </>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="card-shadow space-y-6 rounded-2xl border border-line bg-surface p-6"
        >
          <Section title="Pickup address" description="Where couriers collect your parcels. We deliver in Canada only.">
            <div>
              <label htmlFor="f-country" className="mb-1.5 block text-[13px] font-medium text-fg">
                Country
              </label>
              <input id="f-country" value="Canada" readOnly disabled className={`${inputClass(null)} opacity-70`} />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-[1fr_8rem]">
              <div>
                <label htmlFor="f-businessAddress" className="mb-1.5 block text-[13px] font-medium text-fg">
                  Business address <span className="text-danger">*</span>
                </label>
                <AddressSearch
                  id="f-businessAddress"
                  name="businessAddress"
                  placeholder="Start typing your street address"
                  autoComplete="street-address"
                  className={inputClass(fe("businessAddress"))}
                  onPick={pickAddress}
                  onType={() => {
                    setPoint(null);
                    setAreaNote(null);
                  }}
                />
                {fe("businessAddress") && <p className="mt-1.5 text-[12.5px] text-danger">{fe("businessAddress")}</p>}
              </div>
              <Field name="businessUnit" label="Unit" required={false} placeholder="Apt, suite…" maxLength={40} error={fe("businessUnit")} />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-3">
              <Field name="businessCity" label="City" autoComplete="address-level2" error={fe("businessCity")} />
              <SelectField name="businessProvince" label="Province" options={[...PROVINCES]} error={fe("businessProvince")} />
              <Field
                name="businessPostalCode"
                label="Postal code"
                autoComplete="postal-code"
                placeholder="K1Z 7H1"
                maxLength={7}
                error={fe("businessPostalCode")}
              />
            </div>
            {areaNote && <p className="rounded-xl bg-accent/5 px-3.5 py-2.5 text-[13px] text-fg-muted">{areaNote}</p>}
          </Section>

          <Section title="Your business">
            <FieldRow>
              <Field name="businessName" label="Business name" autoComplete="organization" error={fe("businessName")} />
              <Field name="contactName" label="Contact name" autoComplete="name" error={fe("contactName")} />
            </FieldRow>
            <FieldRow>
              <SelectField name="industry" label="Industry" options={INDUSTRIES} error={fe("industry")} />
              <PhoneField name="businessPhone" label="Contact phone" autoComplete="tel" error={fe("businessPhone")} />
            </FieldRow>
            <FieldRow>
              <Field
                name="website"
                label="Website"
                required={false}
                type="url"
                placeholder="https://yourbusiness.com"
                hint="Leave empty if you don't have one."
                error={fe("website")}
              />
              <Field name="email" label="Primary email" type="email" autoComplete="email" inputMode="email" error={fe("email")} />
            </FieldRow>
            <FieldRow>
              <SelectField name="referralSource" label="How did you hear about SwiftDrop?" required={false} options={HEARD} error={fe("referralSource")} />
              <SelectField
                name="dailyVolume"
                label="Expected daily volume"
                required={false}
                options={VOLUMES}
                error={fe("dailyVolume")}
              />
            </FieldRow>
            <Field name="businessNumber" label="CRA business number" required={false} error={fe("businessNumber")} />
            <div>
              <label htmlFor="f-signupNotes" className="mb-1.5 block text-[13px] font-medium text-fg">
                Anything else you want us to know? <span className="font-normal text-fg-subtle">(optional)</span>
              </label>
              <textarea id="f-signupNotes" name="signupNotes" rows={3} maxLength={1000} className={inputClass(null)} />
            </div>
          </Section>

          <Section title="How do your deliveries go out?">
            <fieldset>
              <legend className="sr-only">How do your deliveries go out?</legend>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {PATTERNS.map((p) => (
                  <label
                    key={p.value}
                    className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line p-3 transition-colors hover:border-accent/50 has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                  >
                    <input type="radio" name="deliveryPattern" value={p.value} className="mt-0.5" />
                    <span>
                      <span className="block text-[13.5px] font-medium text-fg">{p.title}</span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-fg-subtle">{p.text}</span>
                    </span>
                  </label>
                ))}
              </div>
              {fe("deliveryPattern") && <p className="mt-1.5 text-[12.5px] text-danger">{fe("deliveryPattern")}</p>}
            </fieldset>
          </Section>

          <Section title="Password">
            <PasswordField
              name="password"
              label="Password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (confirm) setConfirmError(v === confirm ? null : "Passwords don't match.");
              }}
              hint="At least 8 characters. A mix of letters and numbers is stronger."
              error={fe("password")}
              showStrength
            />
            <PasswordField
              name="confirmPassword"
              label="Confirm password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                if (v) setConfirmError(password === v ? null : "Passwords don't match.");
              }}
              error={confirmError}
            />
          </Section>

          <Section title="Terms of Service">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/terms"
                target="_blank"
                rel="noopener"
                className="rounded-full border border-accent/50 px-3.5 py-1.5 text-[13px] font-medium text-accent hover:bg-accent/5"
              >
                Review terms
              </a>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-fg">
                <input type="checkbox" name="acceptTerms" className="h-4 w-4" />I have read, understand, and agree to the Terms of Service
              </label>
            </div>
            {fe("acceptTerms") && <p className="text-[12.5px] text-danger">{fe("acceptTerms")}</p>}
          </Section>

          {error && <FormAlert>{error}</FormAlert>}

          <div className="space-y-2">
            <SubmitButton busy={busy} idle="Create account" busyLabel="Creating account…" />
            <div className="text-center">
              <StartOver onReset={resetForm} />
            </div>
          </div>
        </form>

        {/* Map: shows where we deliver, then zooms to the pickup address once it is chosen. */}
        <aside className="card-shadow rounded-2xl border border-line bg-surface p-3 lg:sticky lg:top-6">
          <PinMap
            point={point}
            dots={SERVICE_CITIES.map((c) => ({ lat: c.lat, lng: c.lng, label: c.name }))}
            className="h-[320px] lg:h-[560px]"
          />
          <p className="px-2 pb-1 pt-3 text-[12.5px] leading-relaxed text-fg-subtle">
            {point
              ? "This is where couriers will come to collect. Zoom in to check the pin is on your door."
              : `We currently deliver in ${SERVICE_CITIES.map((c) => c.name).join(", ")}. Pick your address to see it on the map.`}
          </p>
        </aside>
      </div>
    </AuthShell>
  );
}

function clearDraft(form: string) {
  try {
    sessionStorage.removeItem(`swiftdrop:draft:${form}`);
  } catch {
    // Private browsing — nothing to clean up.
  }
}
