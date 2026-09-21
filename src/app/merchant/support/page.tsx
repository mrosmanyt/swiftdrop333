import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listTicketsForUser } from "@/lib/repo";
import SupportWidget from "@/components/SupportWidget";

export default async function MerchantSupportPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "MERCHANT") redirect("/login");

  const tickets = listTicketsForUser(user.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-sm text-fg-muted">
          Questions about a delivery, an invoice, or your account — our team sees these directly.
        </p>
      </div>

      <SupportWidget />

      <div className="rounded-xl border border-line bg-surface">
        <div className="border-b border-line p-4 font-semibold">Your tickets</div>
        <table className="w-full text-left text-sm">
          <thead className="text-fg-subtle">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="p-3 font-mono text-xs">{t.reference}</td>
                <td className="p-3">{t.subject}</td>
                <td className="p-3 text-xs">{t.category}</td>
                <td className="p-3 text-xs">{t.status}</td>
                <td className="p-3 text-xs text-fg-subtle">
                  {new Date(t.updated_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!tickets.length && (
              <tr>
                <td className="p-3 text-fg-subtle" colSpan={5}>
                  No tickets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
