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
import { useDraftAutosave } from "@/components/signup/useDraftAutosave";

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
    clearDraft("merchant-signup");
  }

  const fe = (k: string) => fieldErrors[k] ?? null;

  return (
    <AuthShell
      title="Business sign-up"
      subtitle="We verify every business before the first delivery. It usually takes less than a working day."
      width="lg"
      footer={
        <>
          Want to deliver instead?{" "}
          <Link href="/signup/courier" className="text-accent hover:underline">
            Apply as a courier
          </Link>
        </>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
        <Section title="Your business">
          <Field name="businessName" label="Business name" autoComplete="organization" error={fe("businessName")} />
          <FieldRow>
            <Field name="businessCity" label="City" autoComplete="address-level2" error={fe("businessCity")} />
            <Field name="businessNumber" label="CRA business number" required={false} error={fe("businessNumber")} />
          </FieldRow>
        </Section>

        <Section title="Contact">
          <Field name="contactName" label="Your name" autoComplete="name" error={fe("contactName")} />
          <FieldRow>
            <Field name="email" label="Work email" type="email" autoComplete="email" inputMode="email" error={fe("email")} />
            <PhoneField name="businessPhone" label="Business phone" autoComplete="tel" error={fe("businessPhone")} />
          </FieldRow>
          <Field
            name="website"
            label="Website"
            required={false}
            type="url"
            placeholder="https://example.com"
            error={fe("website")}
          />
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

        <Section
          title="Operations"
          description="Helps us plan couriers in your area. Best guess is fine — you can change it later."
        >
          <Field name="businessAddress" label="Pickup address" autoComplete="street-address" error={fe("businessAddress")} />
          <SelectField
            name="dailyVolume"
            label="Expected daily volume"
            required={false}
            options={VOLUMES}
            error={fe("dailyVolume")}
          />
        </Section>

        {error && <FormAlert>{error}</FormAlert>}

        <div className="space-y-2">
          <SubmitButton busy={busy} idle="Create business account" busyLabel="Creating account…" />
          <div className="text-center">
            <StartOver onReset={resetForm} />
          </div>
        </div>
      </form>
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
