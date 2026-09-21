"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";

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
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-bold text-brand">Courier application</h1>
      <p className="mt-1 text-sm text-gray-500">
        After this you&apos;ll upload your documents. An admin reviews every application before
        you can go online.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
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
            className="mt-1 w-full rounded-lg border border-gray-300 p-2"
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
            <p className="rounded-lg bg-yellow-50 p-2 text-xs text-yellow-800">
              Personal auto insurance usually doesn&apos;t cover commercial delivery in Canada —
              you&apos;ll need a commercial or delivery endorsement on your policy.
            </p>
          </>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Continue to documents"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <p className="mt-4 text-sm text-gray-400">
        Running a business instead?{" "}
        <Link href="/signup/merchant" className="text-brand hover:underline">
          Sign up as a merchant
        </Link>
      </p>
    </main>
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
        className="mt-1 w-full rounded-lg border border-gray-300 p-2"
      />
    </label>
  );
}
