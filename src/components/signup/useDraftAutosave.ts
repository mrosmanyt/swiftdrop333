"use client";

import { useEffect, useRef } from "react";

/*
 * Draft autosave for the public sign-up forms.
 *
 * The courier form in particular is long; losing fifteen typed fields
 * because a tab got closed mid-application is the kind of thing that loses
 * the applicant for good. This stores only what's in the form, on that
 * person's own device, and wipes it the moment the sign-up succeeds (or
 * they press "Start over"). No server round-trips, no personal data
 * anywhere else.
 *
 * sessionStorage (not localStorage) was a deliberate choice: the draft
 * should survive an accidental reload or a back-and-forth to the role
 * chooser, but a signup started on someone's laptop shouldn't resurface on
 * their phone the next week.
 */

const PREFIX = "swiftdrop:draft:";

export function draftKey(form: string) {
  return `${PREFIX}${form}`;
}

/** Restores a saved draft, or null. Tolerates private-mode storage failures. */
export function loadDraft(form: string): Record<string, string> | null {
  try {
    const raw = sessionStorage.getItem(draftKey(form));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    // Keep only string values — anything else is malformed by definition.
    return Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>;
  } catch {
    return null;
  }
}

export function clearDraft(form: string) {
  try {
    sessionStorage.removeItem(draftKey(form));
  } catch {
    // Private browsing mode — nothing to clean up.
  }
}

/**
 * Hooks autosave into a plain <form>. Reads fields from the DOM instead of
 * React state, so the three signup pages can keep using uncontrolled
 * inputs and don't need to lift every field into state. The password
 * fields are excluded by name — the strength meter needs them controlled,
 * and they shouldn't be persisted to storage anyway.
 */
export function useDraftAutosave(
  form: string,
  formRef: React.RefObject<HTMLFormElement | null>,
  opts?: { exclude?: string[] }
) {
  const exclude = useRef(new Set(["password", "confirmPassword", ...(opts?.exclude ?? [])]));
  const hasRestorable = useRef(false);

  useEffect(() => {
    const el = formRef.current;
    if (!el) return;

    // Restore once, after mount, before the user sees the form settle.
    const draft = loadDraft(form);
    if (draft) {
      const saved: string[] = [];
      for (const [name, value] of Object.entries(draft)) {
        const field = el.elements.namedItem(name);
        if (
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        ) {
          // Never restore anything into a password-type input.
          if (field.type === "password") continue;
          if (field.value !== value) {
            field.value = value;
            field.dispatchEvent(new Event("input", { bubbles: true }));
          }
          saved.push(name);
        }
      }
      if (saved.length) hasRestorable.current = true;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    function save() {
      const el = formRef.current;
      if (!el) return;
      const data: Record<string, string> = {};
      for (const field of Array.from(el.elements)) {
        if (
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        ) {
          if (field.type === "password" || exclude.current.has(field.name) || !field.name) continue;
          if (field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type)) continue;
          if (!field.value.trim()) continue;
          data[field.name] = field.value;
        }
      }
      try {
        if (Object.keys(data).length) sessionStorage.setItem(draftKey(form), JSON.stringify(data));
      } catch {
        // Storage full or blocked — autosave is best-effort by design.
      }
    }

    function onInput() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(save, 400);
    }

    el.addEventListener("input", onInput);
    el.addEventListener("change", onInput);
    return () => {
      el.removeEventListener("input", onInput);
      el.removeEventListener("change", onInput);
      if (timer) clearTimeout(timer);
    };
  }, [form, formRef]);

  return hasRestorable;
}
