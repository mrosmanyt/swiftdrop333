"use client";

import Link from "next/link";
import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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

const PROVINCES = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

function CustomerSignupForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useDraftAutosave("customer-signup", formRef);

  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  function validateLocal(): string | null {
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (password !== confirm) {
      setConfirmError("Passwords don't match.");
      return null;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setConfirmError(null);
    setError(null);
    setFieldErrors({});

    const localProblem = validateLocal();
    if (localProblem) {
      setError(localProblem);
      return;
    }

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const postalCode = String(form.get("postalCode") || "").trim();

    setBusy(true);
    let res: Response;
    try {
      res = await fetch("/api/signup/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName: form.get("fullName"),
          phone: form.get("phone") || undefined,
          referralCode: (form.get("referralCode") as string) || undefined,
          address: form.get("address") || undefined,
          city: form.get("city") || undefined,
          province: form.get("province") || undefined,
          postalCode: postalCode || undefined,
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

    clearDraftOnSuccess();

    // The account exists now — sign them straight in. If that step fails for
    // any reason, send them to the sign-in page instead of a protected page
    // that would just bounce them.
    const signedIn = await signIn("credentials", { email, password, redirect: false }).catch(() => null);
    window.location.href = signedIn && !signedIn.error ? "/customer" : "/login?created=1";
  }

  function clearDraftOnSuccess() {
    try {
      sessionStorage.removeItem("swiftdrop:draft:customer-signup");
    } catch {
      // Private browsing — nothing to clean up.
    }
  }

  function resetForm() {
    formRef.current?.reset();
    setPassword("");
    setConfirm("");
    setError(null);
    setFieldErrors({});
    setConfirmError(null);
    try {
      sessionStorage.removeItem("swiftdrop:draft:customer-signup");
    } catch {
      // Ignore storage failures.
    }
  }

  const fe = (k: string) => fieldErrors[k] ?? null;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track every delivery sent to you, save addresses, and earn loyalty points."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
          <br />
          Running a business or delivering instead?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            See other options
          </Link>
        </>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
        <Section title="About you">
          <Field name="fullName" label="Full name" autoComplete="name" error={fe("fullName")} />
          <FieldRow>
            <Field name="email" label="Email" type="email" autoComplete="email" inputMode="email" error={fe("email")} />
            <PhoneField name="phone" label="Mobile number" required={false} error={fe("phone")} />
          </FieldRow>
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
          title="Default address"
          description="Optional — saved as your default so your first delivery is one field shorter."
        >
          <Field name="address" label="Street address" required={false} autoComplete="street-address" error={fe("address")} />
          <FieldRow>
            <Field name="city" label="City" required={false} autoComplete="address-level2" error={fe("city")} />
            <SelectField
              name="province"
              label="Province"
              required={false}
              options={PROVINCES}
              error={fe("province")}
            />
          </FieldRow>
          <Field
            name="postalCode"
            label="Postal code"
            required={false}
            placeholder="M5V 2T6"
            autoComplete="postal-code"
            maxLength={7}
            error={fe("postalCode")}
            hint="Helps match you with couriers nearby."
          />
        </Section>

        {(refCode || fe("referralCode")) && (
          <Field
            name="referralCode"
            label="Referral code"
            required={false}
            defaultValue={refCode}
            error={fe("referralCode")}
            hint="You and the person who shared it both earn bonus points."
          />
        )}

        {error && <FormAlert>{error}</FormAlert>}

        <div className="space-y-2">
          <SubmitButton busy={busy} idle="Create account" busyLabel="Creating account…" />
          <div className="text-center">
            <StartOver onReset={resetForm} />
          </div>
        </div>
      </form>
    </AuthShell>
  );
}

export default function CustomerSignupPage() {
  return (
    <Suspense fallback={null}>
      <CustomerSignupForm />
    </Suspense>
  );
}
