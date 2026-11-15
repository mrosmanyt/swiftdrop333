import { PageHeader, TableWrap } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { staffPage } from "@/lib/cms/staff";

export const dynamic = "force-dynamic";

/** Plain-English names for what the log records. Anything not listed is shown as written. */
const ACTIONS: Record<string, string> = {
  staff_signed_in: "Signed in",
  staff_added: "Added a staff member",
  staff_role_changed: "Changed a staff role",
  staff_access_removed: "Turned off a staff member's access",
  staff_access_restored: "Turned a staff member's access back on",
  staff_password_reset: "Reset a staff member's password",
  staff_signed_out_everywhere: "Signed out of every device",
  password_changed: "Changed their password",
  website_draft_saved: "Saved a draft",
  website_published: "Published",
  website_restored_original: "Restored to original",
  website_picture_uploaded: "Uploaded a picture",
  website_backup_downloaded: "Downloaded a backup",
  website_backup_restored: "Restored a backup",
  enquiry_updated: "Updated an enquiry",
  enquiry_deleted: "Deleted an enquiry",
  enquiries_exported: "Downloaded enquiries",
};

export default async function ActivityPage() {
  await staffPage("activity.view");
  const rows = await db
    .prepare(
      `SELECT a.id, a.action, a.target_type, a.target_id, a.notes, a.created_at, u.email AS actor_email
       FROM audit_log a LEFT JOIN users u ON u.id = a.actor_user_id
       WHERE u.role = 'ADMIN'
       ORDER BY a.created_at DESC LIMIT 300`
    )
    .all();

  return (
    <div className="space-y-5">
      <PageHeader title="Activity log" subtitle="Who signed in, edited, published or deleted what — the 300 most recent staff actions." />
      <div className="card-shadow overflow-hidden rounded-2xl border border-line bg-surface">
        <TableWrap>
          <table className="w-full text-left text-[13.5px]">
            <thead className="text-[12px] uppercase tracking-wide text-fg-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Who</th>
                <th className="px-4 py-3 font-medium">What</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="whitespace-nowrap px-4 py-2.5 text-fg-muted">{String(r.created_at).slice(0, 16).replace("T", " ")} UTC</td>
                  <td className="px-4 py-2.5 text-fg">{r.actor_email ?? "—"}</td>
                  <td className="px-4 py-2.5 text-fg">{ACTIONS[r.action] ?? String(r.action).replace(/_/g, " ")}</td>
                  <td className="px-4 py-2.5 text-fg-muted">
                    {r.target_type === "website" && r.target_id ? `${r.target_id}` : ""}
                    {r.notes ? ` ${r.notes}` : ""}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-fg-subtle">
                    Nothing recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableWrap>
      </div>
    </div>
  );
}
