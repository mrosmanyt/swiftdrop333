"use client";

import { useEffect, useRef, useState } from "react";

export interface PickedAddress {
  label: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  onChange?: (value: PickedAddress) => void;
}

/**
 * Address field with live autocomplete from /api/geocode.
 *
 * Important: it degrades instead of blocking. If the geocoding provider is
 * unreachable the field still works as a plain text input — the order is
 * created with the typed address and no coordinates, and pricing falls
 * back to the zone's flat estimate.
 */
export default function AddressInput({ label, name, required = true, defaultValue = "", onChange }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleInput(next: string) {
    setValue(next);
    // Typing invalidates any previously picked coordinates.
    setCoords({ lat: null, lng: null });
    onChange?.({ label: next, lat: null, lng: null });

    if (timer.current) clearTimeout(timer.current);
    if (next.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(next)}`);
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setDegraded(!!data.degraded);
        setOpen((data.suggestions ?? []).length > 0);
      } catch {
        setDegraded(true);
      }
    }, 350);
  }

  function pick(s: any) {
    setValue(s.label);
    setCoords({ lat: s.lat, lng: s.lng });
    onChange?.({ label: s.label, lat: s.lat, lng: s.lng });
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <label className="block text-sm">
        {label}
        <input
          name={name}
          value={value}
          required={required}
          autoComplete="off"
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-2"
        />
      </label>
      <input type="hidden" name={`${name}Lat`} value={coords.lat ?? ""} />
      <input type="hidden" name={`${name}Lng`} value={coords.lng ?? ""} />

      {coords.lat != null && (
        <p className="mt-1 text-xs text-green-600">✓ Address pinned — exact distance pricing</p>
      )}
      {degraded && coords.lat == null && value.length > 2 && (
        <p className="mt-1 text-xs text-gray-400">
          Address lookup unavailable right now — type the full address and we&apos;ll use zone pricing.
        </p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
