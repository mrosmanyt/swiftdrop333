"use client";

import { useEffect, useRef, useState } from "react";

export interface AddressPick {
  label: string;
  lat: number;
  lng: number;
  city?: string;
  postcode?: string;
  state?: string;
  street?: string;
}

/**
 * Text box with Canadian address suggestions (GET /api/public/geocode).
 * It never blocks: if the lookup service is down, it is just a text box and
 * the person types their address by hand.
 *
 * The input is uncontrolled (so sign-up draft autosave can restore it).
 */
export default function AddressSearch({
  id,
  name,
  placeholder,
  className,
  defaultValue,
  autoComplete = "off",
  onPick,
  onType,
}: {
  id?: string;
  name?: string;
  placeholder?: string;
  className: string;
  defaultValue?: string;
  autoComplete?: string;
  onPick: (pick: AddressPick) => void;
  /** Called when the person types (any earlier pick no longer applies). */
  onType?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestions, setSuggestions] = useState<AddressPick[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  function typed(value: string) {
    onType?.();
    setActive(-1);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/public/geocode?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        setNote(data.degraded ? "Address lookup is unavailable right now — type the address in full." : null);
        setOpen(true);
      } catch {
        setSuggestions([]);
        setNote("Address lookup is unavailable right now — type the address in full.");
      }
    }, 350);
  }

  function choose(s: AddressPick) {
    if (input.current) input.current.value = s.street || s.label;
    setOpen(false);
    setSuggestions([]);
    onPick(s);
  }

  return (
    <div ref={box} className="relative">
      <input
        ref={input}
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={id ? `${id}-list` : undefined}
        className={className}
        onInput={(e) => typed(e.currentTarget.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !suggestions.length) return;
          if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(suggestions.length - 1, a + 1)));
          else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(0, a - 1)));
          else if (e.key === "Enter" && active >= 0) (e.preventDefault(), choose(suggestions[active]));
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && suggestions.length > 0 && (
        <ul
          id={id ? `${id}-list` : undefined}
          role="listbox"
          className="absolute z-[1000] mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-xl"
        >
          {suggestions.map((s, i) => (
            <li key={`${s.label}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
                className={`block w-full px-3.5 py-2 text-left text-[13.5px] ${
                  i === active ? "bg-accent/10 text-fg" : "text-fg-muted hover:bg-fg/5 hover:text-fg"
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {note && <p className="mt-1.5 text-[12px] text-fg-subtle">{note}</p>}
    </div>
  );
}
