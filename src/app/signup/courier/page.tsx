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

const VEHICLES = [
  { value: "BIKE", label: "Bicycle" },
  { value: "SCOOTER", label: "Scooter / moped" },
  { value: "CAR", label: "Car" },
  { value: "VAN", label: "Van" },
];

function CourierSignupForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [vehicleType, setVehicleType] = useState("BIKE");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useDraftAutosave("courier-signup", formRef);

  const motorised = vehicleType === "CAR" || vehicleType === "VAN";

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
      res = await fetch("/api/signup/courier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName: form.get("fullName"),
          phone: form.get("phone"),
          vehicleType,
          vehicleMakeModel: form.get("vehicleMakeModel") || undefined,
          vehiclePlate: form.get("vehiclePlate") || undefined,
          licenseNumber: form.get("licenseNumber") || undefined,
          licenseExpiry: form.get("licenseExpiry") || undefined,
          insuranceProvider: form.get("insuranceProvider") || undefined,
          insurancePolicyNumber: form.get("insurancePolicyNumber") || undefined,
          insuranceExpiry: form.get("insuranceExpiry") || undefined,
          referralCode: (form.get("referralCode") as string) || undefined,
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

    clearDraft("courier-signup");

    // The account exists now — sign them straight in. If that step fails for
    // any reason, send them to the sign-in page instead of a protected page
    // that would just bounce them.
    const signedIn = await signIn("credentials", { email, password, redirect: false }).catch(() => null);
    window.location.href = signedIn && !signedIn.error ? "/driver/documents" : "/login?created=1";
  }

  function resetForm() {
    formRef.current?.reset();
    setVehicleType("BIKE");
    setPassword("");
    setConfirm("");
    setError(null);
    setFieldErrors({});
    setConfirmError(null);
    clearDraft("courier-signup");
  }

  const fe = (k: string) => fieldErrors[k] ?? null;

  return (
    <AuthShell
      title="Courier application"
      subtitle="After this you'll upload your documents. Our team reviews every application before you can go online."
      width="lg"
      footer={
        <>
          Running a business instead?{" "}
          <Link href="/signup/merchant" className="text-accent hover:underline">
            Sign up as a merchant
          </Link>
        </>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
        <Section title="About you">
          <Field name="fullName" label="Full name" autoComplete="name" error={fe("fullName")} />
          <FieldRow>
            <Field name="email" label="Email" type="email" autoComplete="email" inputMode="email" error={fe("email")} />
            <PhoneField name="phone" label="Mobile number" error={fe("phone")} />
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

        <Section title="Your vehicle">
          <SelectField
            name="vehicleType"
            label="Vehicle"
            options={VEHICLES}
            value={vehicleType}
            onChange={setVehicleType}
            error={fe("vehicleType")}
          />
          {motorised && (
            <FieldRow>
              <Field name="vehicleMakeModel" label="Make & model" placeholder="e.g. Toyota Sienna 2019" error={fe("vehicleMakeModel")} />
              <Field name="vehiclePlate" label="Licence plate" error={fe("vehiclePlate")} />
            </FieldRow>
          )}
        </Section>

        {motorised && (
          <Section
            title="Licence & insurance"
            description="Required for car and van couriers. You'll upload photos of these documents next."
          >
            <FieldRow>
              <Field
                name="licenseNumber"
                label="Driver's licence number"
                hint="We keep only the last 4 digits."
                error={fe("licenseNumber")}
              />
              <Field name="licenseExpiry" label="Licence expiry" type="date" error={fe("licenseExpiry")} />
            </FieldRow>
            <FieldRow>
              <Field name="insuranceProvider" label="Insurance provider" error={fe("insuranceProvider")} />
              <Field
                name="insurancePolicyNumber"
                label="Policy number"
                hint="We keep only the last 4 digits."
                error={fe("insurancePolicyNumber")}
              />
            </FieldRow>
            <Field name="insuranceExpiry" label="Insurance expiry" type="date" error={fe("insuranceExpiry")} />
            <FormAlert tone="warn">
              Personal auto insurance usually doesn&apos;t cover commercial delivery in Canada — you&apos;ll need a
              commercial or delivery endorsement on your policy.
            </FormAlert>
          </Section>
        )}

        {(refCode || fe("referralCode")) && (
          <Field
            name="referralCode"
            label="Referral code (optional)"
            required={false}
            defaultValue={refCode}
            error={fe("referralCode")}
          />
        )}

        {error && <FormAlert>{error}</FormAlert>}

        <div className="space-y-2">
          <SubmitButton busy={busy} idle="Continue to documents" busyLabel="Submitting…" />
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

export default function CourierSignupPage() {
  return (
    <Suspense fallback={null}>
      <CourierSignupForm />
    </Suspense>
  );
}
