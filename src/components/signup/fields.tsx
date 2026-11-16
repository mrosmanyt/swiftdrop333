"use client";

import { useState } from "react";

/*
 * Shared form pieces for the three public sign-up pages (customer, courier,
 * business). They exist so the three forms stay visually identical — before
 * this each page carried its own copy of a `Field` component and they had
 * already drifted apart.
 *
 * Everything here is presentation + input hygiene. Validation that protects
 * the database still lives on the server (zod in the API routes); these
 * components add the inline, friendlier half of it.
 */

const inputBase =
  "w-full rounded-xl border bg-bg px-3.5 py-2.5 text-[14.5px] leading-6 text-fg " +
  "placeholder:text-fg-subtle outline-none transition disabled:opacity-60";

export function inputClass(error?: string | null) {
  return `${inputBase} ${
    error
      ? "border-danger focus:border-danger focus:ring-4 focus:ring-danger/10"
      : "border-line focus:border-accent focus:ring-4 focus:ring-accent/10"
  }`;
}

function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13.5px] font-medium text-fg">
      {label}
      {!required && <span className="ml-1.5 font-normal text-fg-subtle">optional</span>}
    </label>
  );
}

function FieldNote({ error, hint, id }: { error?: string | null; hint?: string; id: string }) {
  if (error) {
    return (
      <p id={id} className="mt-1.5 text-[12.5px] leading-snug text-danger">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-[12.5px] leading-snug text-fg-subtle">
        {hint}
      </p>
    );
  }
  return null;
}

export interface FieldProps {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "date" | "number";
  required?: boolean;
  hint?: string;
  error?: string | null;
  defaultValue?: string;
  value?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal";
  placeholder?: string;
  maxLength?: number;
  min?: string | number;
  step?: string | number;
  onChange?: (value: string) => void;
}

/** A labelled text input with an optional hint line and inline error. */
export function Field({
  name,
  label,
  type = "text",
  required = true,
  hint,
  error,
  defaultValue,
  value,
  autoComplete,
  inputMode,
  placeholder,
  maxLength,
  min,
  step,
  onChange,
}: FieldProps) {
  const id = `f-${name}`;
  const noteId = `${id}-note`;
  const controlled = value !== undefined;

  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={controlled ? undefined : defaultValue}
        value={controlled ? value : undefined}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        step={step}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? noteId : undefined}
        onBlur={
          onChange
            ? (e) => onChange(e.currentTarget.value)
            : undefined
        }
        className={inputClass(error)}
      />
      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
}

export interface SelectFieldProps {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  options: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

/** Native <select> in the same visual language as <Field>. */
export function SelectField({
  name,
  label,
  required = true,
  hint,
  error,
  options,
  value,
  defaultValue,
  onChange,
}: SelectFieldProps) {
  const id = `f-${name}`;
  const noteId = `${id}-note`;
  const controlled = value !== undefined;

  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <div className="relative">
        <select
          id={id}
          name={name}
          required={required}
          value={controlled ? value : undefined}
          defaultValue={controlled ? undefined : defaultValue}
          onChange={onChange ? (e) => onChange(e.currentTarget.value) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? noteId : undefined}
          className={`${inputClass(error)} appearance-none pr-9`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 7.5 10 12.5 15 7.5" />
        </svg>
      </div>
      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
}

/**
 * Formats a North-American phone number for display once the person leaves
 * the field. Deliberately on blur, not per keystroke: reformatting while
 * someone is editing in the middle of the number sends the caret jumping.
 * Anything that isn't a plain 10-digit (or +1 11-digit) number is left
 * exactly as typed, so international numbers still work.
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

export function PhoneField({
  name,
  label,
  required = true,
  hint,
  error,
  defaultValue,
  autoComplete = "tel",
}: FieldProps) {
  const id = `f-${name}`;
  const noteId = `${id}-note`;

  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <input
        id={id}
        name={name}
        type="tel"
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        inputMode="tel"
        placeholder="(416) 555-0123"
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? noteId : undefined}
        onBlur={(e) => {
          const formatted = formatPhone(e.currentTarget.value);
          if (formatted !== e.currentTarget.value) e.currentTarget.value = formatted;
        }}
        className={inputClass(error)}
      />
      <FieldNote id={noteId} error={error} hint={hint ?? "For delivery updates. We never share it."} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Password                                                                   */
/* -------------------------------------------------------------------------- */

export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

const STRENGTH = [
  { label: "Too weak", bar: "bg-danger" },
  { label: "Weak", bar: "bg-danger" },
  { label: "Fair", bar: "bg-warn" },
  { label: "Good", bar: "bg-accent" },
  { label: "Strong", bar: "bg-ok" },
];

function StrengthMeter({ password }: { password: string }) {
  const score = scorePassword(password);
  const level = STRENGTH[score];

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              password && i <= score ? level.bar : "bg-line"
            }`}
          />
        ))}
      </div>
      {password && (
        <p className="mt-1.5 text-[12px] text-fg-subtle">
          Password strength: <span className="font-medium text-fg-muted">{level.label}</span>
          {score < 2 && " — use 8+ characters with a mix of letters and numbers."}
        </p>
      )}
    </div>
  );
}

export interface PasswordFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string | null;
  autoComplete?: string;
  showStrength?: boolean;
}

export function PasswordField({
  name,
  label,
  value,
  onChange,
  hint,
  error,
  autoComplete = "new-password",
  showStrength = false,
}: PasswordFieldProps) {
  const [shown, setShown] = useState(false);
  const id = `f-${name}`;
  const noteId = `${id}-note`;

  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required />
      <div className="relative">
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          autoComplete={autoComplete}
          minLength={8}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? noteId : undefined}
          className={`${inputClass(error)} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-fg-subtle transition hover:bg-surface-2 hover:text-fg"
        >
          {shown ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {showStrength && <StrengthMeter password={value} />}
      <FieldNote id={noteId} error={error} hint={hint} />
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12S18 18.5 12 18.5 2.5 12 2.5 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.4 3.1M6.5 7.8A16.8 16.8 0 0 0 2.5 12S6 18 12 18a9.3 9.3 0 0 0 3.4-.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 9.9a2.9 2.9 0 0 0 4.1 4.1" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

/** A titled block inside a form, separated by a hairline rule. */
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3.5 flex items-center gap-3">
        <h2 className="shrink-0 text-[11.5px] font-semibold uppercase tracking-[0.09em] text-fg-subtle">
          {title}
        </h2>
        <div className="h-px flex-1 bg-line" />
      </div>
      {description && (
        <p className="mb-3.5 text-[12.5px] leading-relaxed text-fg-subtle">{description}</p>
      )}
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

/** Two fields side by side on wide screens, stacked on phones. */
export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3.5 sm:grid-cols-2">{children}</div>;
}

export function FormAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "info" | "warn";
  children: React.ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-danger/25 bg-danger-soft text-danger"
      : tone === "warn"
        ? "border-warn/25 bg-warn-soft text-warn"
        : "border-info/25 bg-info-soft text-info";

  return (
    <p role="alert" className={`rounded-xl border px-3.5 py-2.5 text-[13px] leading-relaxed ${styles}`}>
      {children}
    </p>
  );
}

export function SubmitButton({ busy, idle, busyLabel }: { busy: boolean; idle: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-inverse py-2.5 text-[14.5px] font-medium text-inverse-fg transition hover:opacity-90 active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {busy ? busyLabel : idle}
    </button>
  );
}

/** Small text button that clears an autosaved draft and resets the form. */
export function StartOver({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={onReset}
      className="text-[12.5px] text-fg-subtle underline decoration-line underline-offset-4 transition hover:text-fg"
    >
      Start over
    </button>
  );
}
