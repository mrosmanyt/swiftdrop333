"use client";

import { useState } from "react";

interface Zone {
  id: string;
  city: string;
  name: string;
}

const SAMPLE = `customerName,dropoffAddress,customerPhone,customerEmail,deliveryInstructions,serviceType
Ayesha Khan,"456 King St W, Toronto",+14165551234,ayesha@example.com,Buzzer 402,SAME_DAY
Omar Farooq,"88 Dundas St E, Toronto",+14165555678,,Leave with concierge,NEXT_DAY`;

/** Upload one CSV, get many deliveries. Bad rows are reported by line
 *  number and the good ones still go through. */
export default function BulkUpload({ zones, defaultPickup }: { zones: Zone[]; defaultPickup: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/merchant/bulk-upload", { method: "POST", body: form });
    setBusy(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Upload failed.");
      return;
    }
    setResult(await res.json());
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "swiftdrop-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Bulk upload</h2>
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-line bg-surface p-4">
        <p className="text-sm text-fg-muted">
          CSV columns: <code className="text-xs">customerName, dropoffAddress, customerPhone,
          customerEmail, deliveryInstructions, serviceType</code>{" "}
          <button type="button" onClick={downloadSample} className="text-accent hover:underline">
            download sample
          </button>
        </p>

        <label className="block text-sm">
          Zone
          <select name="zoneId" className="mt-1 w-full rounded-lg border border-line p-2">
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.city} — {z.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          Pickup address (used for rows that don&apos;t set their own)
          <input
            name="pickupAddress"
            defaultValue={defaultPickup}
            className="mt-1 w-full rounded-lg border border-line p-2"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="geocode" value="true" defaultChecked />
          Look up coordinates for each address (better pricing and batching, slower upload)
        </label>

        <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent-solid px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Creating deliveries…" : "Upload CSV"}
        </button>

        {error && <p className="text-sm text-danger">{error}</p>}

        {result && (
          <div className="rounded-lg bg-bg-soft p-3 text-sm">
            <p className="font-medium text-ok">{result.createdCount} deliveries created</p>
            {result.failed?.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-danger">{result.failed.length} row(s) skipped:</p>
                <ul className="mt-1 space-y-0.5 text-xs text-danger">
                  {result.failed.map((f: any, i: number) => (
                    <li key={i}>
                      Line {f.line}: {f.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
