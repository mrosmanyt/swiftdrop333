"use client";

import { useEffect, useState } from "react";

/** Mint, view and revoke API keys, and point webhooks at the merchant's
 *  own system. The raw key is shown exactly once. */
export default function ApiKeyManager({ initialKeys }: { initialKeys: any[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** The sample curl needs an absolute URL. Behind a proxy or a custom
   *  domain only NEXT_PUBLIC_APP_URL knows the public address, so that wins;
   *  otherwise we fall back to the browser's own origin, read after mount —
   *  reading window during render would make server and client HTML disagree. */
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const [origin, setOrigin] = useState(configuredOrigin);
  useEffect(() => {
    if (!configuredOrigin) setOrigin(window.location.origin);
  }, [configuredOrigin]);

  async function reload() {
    const res = await fetch("/api/merchant/api-keys");
    if (res.ok) setKeys((await res.json()).keys ?? []);
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/merchant/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        webhookUrl: form.get("webhookUrl") || "",
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not create key.");
      return;
    }
    const data = await res.json();
    setNewKey(data.apiKey);
    (e.target as HTMLFormElement).reset();
    reload();
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? Any integration using it stops working immediately.")) return;
    await fetch(`/api/merchant/api-keys/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">API & webhooks</h2>

      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-sm text-fg-muted">
          Create deliveries straight from your own system or online store:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
{`curl -X POST ${origin}/api/v1/orders \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"pickupAddress":"...","dropoffAddress":"...","customerName":"Ayesha","customerPhone":"+1416..."}'`}
        </pre>

        <form onSubmit={create} className="mt-4 flex flex-wrap items-end gap-2">
          <label className="text-xs text-fg-muted">
            Key name
            <input name="name" required placeholder="Shopify store" className="mt-1 block w-40 rounded-lg border border-line p-2 text-sm" />
          </label>
          <label className="flex-1 text-xs text-fg-muted">
            Webhook URL (optional — we POST status updates here)
            <input name="webhookUrl" type="url" placeholder="https://yourstore.ca/hooks/swiftdrop" className="mt-1 block w-full rounded-lg border border-line p-2 text-sm" />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent-solid px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            Create key
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}

        {newKey && (
          <div className="mt-3 rounded-lg border border-ok/30 bg-ok-soft p-3">
            <p className="text-xs font-medium text-ok">
              Copy this now — it won&apos;t be shown again:
            </p>
            <code className="mt-1 block break-all text-xs text-ok">{newKey}</code>
          </div>
        )}

        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-fg-subtle">
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Key</th>
              <th className="py-2">Webhook</th>
              <th className="py-2">Last used</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-t border-line">
                <td className="py-2">{k.name}</td>
                <td className="py-2 font-mono text-xs">{k.keyPrefix}…</td>
                <td className="py-2 max-w-[180px] truncate text-xs text-fg-muted">{k.webhookUrl ?? "—"}</td>
                <td className="py-2 text-xs text-fg-subtle">
                  {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "never"}
                </td>
                <td className="py-2 text-right">
                  {k.revokedAt ? (
                    <span className="text-xs text-fg-subtle">revoked</span>
                  ) : (
                    <button onClick={() => revoke(k.id)} className="text-xs text-danger hover:underline">
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!keys.length && (
              <tr>
                <td className="py-2 text-fg-subtle" colSpan={5}>
                  No API keys yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
