import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listNotifications } from "@/lib/repo";
import AutoRefresh from "@/components/AutoRefresh";

export default async function AdminNotificationsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const notifications = listNotifications(200);
  const logged = notifications.filter((n) => n.status === "logged").length;
  const failed = notifications.filter((n) => n.status === "failed").length;

  return (
    <div className="space-y-4">
      <AutoRefresh intervalMs={15000} />
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-fg-muted">
          Every SMS and email the system generated — the audit trail for &quot;did the customer
          actually get their tracking link?&quot;
        </p>
      </div>

      {logged > 0 && (
        <div className="rounded-xl border border-warn/30 bg-warn-soft p-3 text-sm text-warn">
          <p className="font-medium">{logged} message(s) logged but not sent</p>
          <p className="mt-1">
            No SMS/email provider is configured yet. Add TWILIO_* and RESEND_API_KEY to
            <code className="mx-1 rounded bg-surface px-1">.env</code> and these will start sending
            for real — no code changes needed.
          </p>
        </div>
      )}
      {failed > 0 && (
        <div className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
          {failed} message(s) failed at the provider — check the error column.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="text-fg-subtle">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Channel</th>
              <th className="p-3">To</th>
              <th className="p-3">Template</th>
              <th className="p-3">Body</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id} className="border-t border-line align-top">
                <td className="p-3 text-xs text-fg-subtle">
                  {new Date(n.created_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </td>
                <td className="p-3 text-xs uppercase">{n.channel}</td>
                <td className="p-3 text-xs">{n.recipient}</td>
                <td className="p-3 text-xs text-fg-muted">{n.template}</td>
                <td className="p-3 max-w-md text-xs text-fg-muted">{n.body}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      n.status === "sent"
                        ? "bg-ok-soft text-ok"
                        : n.status === "failed"
                        ? "bg-danger-soft text-danger"
                        : "bg-surface-2 text-fg-muted"
                    }`}
                  >
                    {n.status}
                  </span>
                  {n.error && <div className="mt-1 text-xs text-danger">{n.error}</div>}
                </td>
              </tr>
            ))}
            {!notifications.length && (
              <tr>
                <td className="p-3 text-fg-subtle" colSpan={6}>
                  Nothing sent yet — create a delivery with a customer phone/email.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
