"use client";

import { useEffect, useState } from "react";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  target: number;
  bonusCents: number;
  endsAt: string;
  progress: number;
  complete: boolean;
  claimed: boolean;
}

/** Live bonus campaigns with a real progress bar — the courier can see how
 *  close they are while there's still time to act on it. */
export default function ChallengeList() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/couriers/me/challenges");
    if (!res.ok) return;
    const data = await res.json();
    setChallenges(data.challenges ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function claim(id: string) {
    setBusy(id);
    await fetch("/api/couriers/me/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: id }),
    });
    setBusy(null);
    load();
  }

  if (!challenges.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Challenges</h2>
      {challenges.map((c) => {
        const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
        return (
          <div key={c.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{c.title}</p>
                {c.description && <p className="text-xs text-fg-muted">{c.description}</p>}
                <p className="mt-1 text-xs text-fg-subtle">
                  Ends {new Date(c.endsAt).toLocaleDateString()}
                </p>
              </div>
              <p className="text-lg font-semibold text-ok">+${(c.bonusCents / 100).toFixed(2)}</p>
            </div>

            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${c.complete ? "bg-ok-solid" : "bg-accent-solid"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-fg-muted">
                {c.progress} / {c.target} deliveries
                {!c.complete && ` · ${c.target - c.progress} to go`}
              </p>
            </div>

            {c.complete && !c.claimed && (
              <button
                onClick={() => claim(c.id)}
                disabled={busy === c.id}
                className="mt-3 rounded-lg bg-ok-solid px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy === c.id ? "Claiming…" : "Claim bonus"}
              </button>
            )}
            {c.claimed && <p className="mt-2 text-xs text-ok">Bonus claimed ✓</p>}
          </div>
        );
      })}
    </div>
  );
}
