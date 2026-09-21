"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import AuthShell from "@/components/AuthShell";

export default function CourierSignupPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState("BIKE");

  const motorised = vehicleType !== "BIKE";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const res = await fetch("/api/signup/courier", {
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
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setBusy(false);
      setError(
        typeof data.error === "string"
          ? data.error
          : "Check the form — password must be at least 8 characters."
      );
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    window.location.href = "/driver/documents";
  }

  return (
    <AuthShell
      title="Courier application"
      subtitle="After this you'll upload your documents. Our team reviews every application before you can go online."
      width="lg"
      footer={<>
          Running a business instead?{" "}
          <Link href="/signup/merchant" className="text-accent hover:underline">
            Sign up as a merchant
          </Link>
        </>}
    >

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field name="fullName" label="Full name" />
        <Field name="email" label="Email" type="email" />
        <Field name="password" label="Password (min 8 characters)" type="password" />
        <Field name="phone" label="Mobile number" />

        <label className="block text-sm">
          Vehicle
          <select
            name="vehicleType"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg outline-none transition focus:border-accent"
          >
            <option value="BIKE">Bicycle</option>
            <option value="SCOOTER">Scooter / moped</option>
            <option value="CAR">Car</option>
            <option value="VAN">Van</option>
          </select>
        </label>

        {motorised && (
          <>
            <Field name="vehicleMakeModel" label="Make & model" required={false} />
            <Field name="vehiclePlate" label="Licence plate" required={false} />
            <Field name="licenseNumber" label="Driver's licence number" required={false} />
            <Field name="licenseExpiry" label="Licence expiry" type="date" required={false} />
            <Field name="insuranceProvider" label="Insurance provider" required={false} />
            <Field name="insurancePolicyNumber" label="Policy number" required={false} />
            <Field name="insuranceExpiry" label="Insurance expiry" type="date" required={false} />
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-200/80">
              Personal auto insurance usually doesn&apos;t cover commercial delivery in Canada —
              you&apos;ll need a commercial or delivery endorsement on your policy.
            </p>
          </>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-inverse py-2 font-medium text-inverse-fg hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Continue to documents"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </AuthShell>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-lg border border-line bg-bg p-2.5 text-fg outline-none transition focus:border-accent"
      />
    </label>
  );
}
