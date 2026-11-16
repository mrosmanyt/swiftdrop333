"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import AddressSearch, { type AddressPick } from "@/components/maps/AddressSearch";
import type { ZoneMapProps } from "@/components/maps/ZoneMapInner";
import type { ServiceType } from "@/lib/pricing";
import { distanceKm } from "@/lib/site/canada";
import {
  CALCULATOR_SERVICES,
  ZONE_COLORS,
  estimateCents,
  money,
  zoneBands,
  zoneNumberFor,
  type RateArea,
} from "@/lib/site/zones";

const ZoneMap = dynamic<ZoneMapProps>(() => import("@/components/maps/ZoneMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] w-full items-center justify-center rounded-2xl bg-surface-2 text-sm text-fg-subtle lg:h-[520px]">
      Loading map…
    </div>
  ),
});

const input = "block w-full rounded-xl border border-line px-3.5 py-2.5 text-[15px] text-fg";
const label = "mb-1.5 block text-[13px] font-medium text-fg";

interface CityInfo {
  name: string;
  province: string;
  radiusKm: number;
}

/**
 * Zone price calculator: choose a service, enter the pickup address, and see
 * every delivery zone around it with its price — on a list and on a map.
 * Optionally enter a drop-off address to get the price for that delivery.
 */
export default function ZoneCalculator({ note, outsideText }: { note: string; outsideText: string }) {
  const [service, setService] = useState<ServiceType>("SAME_DAY");
  const [pickup, setPickup] = useState<AddressPick | null>(null);
  const [dropoff, setDropoff] = useState<AddressPick | null>(null);
  const [city, setCity] = useState<CityInfo | null>(null);
  const [areas, setAreas] = useState<RateArea[]>([]);
  const [areaId, setAreaId] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ready" | "outside" | "error">("idle");
  const [hover, setHover] = useState<number | null>(null);

  // Look up the city and its live rates whenever the pickup changes.
  useEffect(() => {
    if (!pickup) {
      setState("idle");
      setCity(null);
      setAreas([]);
      return;
    }
    let cancelled = false;
    setState("loading");
    fetch(`/api/public/zones?lat=${pickup.lat}&lng=${pickup.lng}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        if (!data.city) return setState("outside");
        setCity(data.city);
        setAreas(data.areas ?? []);
        setAreaId(data.areas?.[0]?.id ?? "");
        setState("ready");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [pickup]);

  const rate = areas.find((a) => a.id === areaId) ?? areas[0] ?? null;
  const bands = useMemo(() => (rate && city ? zoneBands(rate, service, city.radiusKm) : []), [rate, service, city]);
  const ringsKm = useMemo(() => bands.map((b) => b.toKm), [bands]);

  const drop = useMemo(() => {
    if (!pickup || !dropoff || !rate || !bands.length) return null;
    const km = distanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const zone = zoneNumberFor(km, bands.length);
    return { km, zone, cents: zone ? estimateCents(rate, service, km) : null };
  }, [pickup, dropoff, rate, bands, service]);

  return (
    <div className="card-shadow rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <div>
          <label htmlFor="zc-service" className={label}>
            Service
          </label>
          <select id="zc-service" className={input} value={service} onChange={(e) => setService(e.target.value as ServiceType)}>
            {CALCULATOR_SERVICES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="zc-pickup" className={label}>
            Pickup address
          </label>
          <AddressSearch
            id="zc-pickup"
            placeholder="Enter your pickup address"
            className={input}
            onPick={(p) => {
              setPickup(p);
              setDropoff(null);
            }}
            onType={() => setPickup(null)}
          />
        </div>
      </div>

      {state === "idle" && (
        <p className="mt-6 rounded-xl border border-dashed border-line px-4 py-10 text-center text-[14px] text-fg-subtle">
          Enter a pickup address and choose it from the list to see the zones and prices around it.
        </p>
      )}
      {state === "loading" && <p className="mt-6 px-1 text-[14px] text-fg-subtle">Working out your zones…</p>}
      {state === "outside" && <p className="mt-6 rounded-xl bg-warn-soft px-4 py-3 text-[14px] text-warn">{outsideText}</p>}
      {state === "error" && (
        <p role="alert" className="mt-6 rounded-xl bg-danger-soft px-4 py-3 text-[14px] text-danger">
          We couldn’t load prices just now. Please try again in a moment.
        </p>
      )}

      {state === "ready" && city && rate && (
        <>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-5">
            <p className="max-w-xl text-[14px] leading-relaxed text-fg-muted">
              These are the <strong className="text-fg">{CALCULATOR_SERVICES.find((s) => s.value === service)?.label}</strong> delivery
              zones around your pickup address in{" "}
              <strong className="text-fg">
                {city.name}, {city.province}
              </strong>
              .
            </p>
            {areas.length > 1 && (
              <div>
                <label htmlFor="zc-area" className={label}>
                  Rate area
                </label>
                <select id="zc-area" className={input} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {rate.surgeMultiplier > 1 && (
            <p className="mt-3 rounded-xl bg-warn-soft px-4 py-2.5 text-[13px] text-warn">
              Busy-period pricing ({rate.surgeMultiplier}×) is active in this area right now and is included below.
            </p>
          )}

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div>
              <ol className="max-h-[420px] space-y-2 overflow-y-auto pr-1 lg:max-h-[440px]">
                {bands.map((b) => {
                  const on = drop?.zone === b.n || hover === b.n;
                  return (
                    <li
                      key={b.n}
                      onMouseEnter={() => setHover(b.n)}
                      onMouseLeave={() => setHover(null)}
                      style={{ borderLeftColor: ZONE_COLORS[(b.n - 1) % ZONE_COLORS.length] }}
                      className={`flex items-center justify-between gap-3 rounded-xl border border-l-4 border-line px-3.5 py-2.5 transition-colors ${
                        on ? "bg-accent/5" : "bg-surface"
                      }`}
                    >
                      <div>
                        <p className="text-[14.5px] font-semibold text-fg">Zone {b.n}</p>
                        <p className="text-[12.5px] text-fg-subtle">
                          {b.fromKm}–{b.toKm} km from pickup
                        </p>
                      </div>
                      <p className="whitespace-nowrap rounded-lg bg-accent/10 px-2.5 py-1 text-[13.5px] font-semibold tabular-nums text-accent">
                        {b.minCents === b.maxCents ? money(b.maxCents) : `${money(b.minCents)} – ${money(b.maxCents)}`}
                      </p>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3.5">
                <label htmlFor="zc-dropoff" className={label}>
                  Check one delivery <span className="font-normal text-fg-subtle">(optional)</span>
                </label>
                <AddressSearch
                  id="zc-dropoff"
                  placeholder="Enter a drop-off address"
                  className={input}
                  onPick={setDropoff}
                  onType={() => setDropoff(null)}
                />
                {drop && (
                  <p className="mt-3 text-[14px] text-fg" role="status">
                    {drop.zone && drop.cents !== null ? (
                      <>
                        About {drop.km.toFixed(1)} km away — <strong>Zone {drop.zone}</strong>, estimated{" "}
                        <strong>{money(drop.cents)}</strong>.
                      </>
                    ) : (
                      <>That address is about {drop.km.toFixed(1)} km away, beyond our furthest zone from this pickup.</>
                    )}
                  </p>
                )}
              </div>
            </div>

            <ZoneMap
              pickup={pickup ? { lat: pickup.lat, lng: pickup.lng } : null}
              dropoff={dropoff ? { lat: dropoff.lat, lng: dropoff.lng } : null}
              ringsKm={ringsKm}
              highlight={drop?.zone ?? hover}
            />
          </div>

          <p className="mt-5 text-[12.5px] leading-relaxed text-fg-subtle">{note}</p>
        </>
      )}
    </div>
  );
}
