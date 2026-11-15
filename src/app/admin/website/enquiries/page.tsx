import { PageHeader } from "@/components/portal/ui";
import EnquiriesInbox from "@/components/cms/EnquiriesInbox";
import { staffPage } from "@/lib/cms/staff";
import { can } from "@/lib/cms/permissions";
import { listEnquiries } from "@/lib/cms/enquiries";
import { getContent } from "@/lib/cms/content";
import { listStaff } from "@/lib/cms/staffRepo";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  const staff = await staffPage("enquiries.view");
  const [enquiries, contact, team] = await Promise.all([listEnquiries(), getContent("contact"), listStaff()]);
  // Types offered now, plus any older ones still attached to enquiries.
  const types = Array.from(new Set([...contact.types, "Something else", ...enquiries.map((e) => e.type)]));

  return (
    <div className="space-y-5">
      <PageHeader title="Enquiries" subtitle="Every message sent from the website’s contact page. Tap one to open it." />
      <EnquiriesInbox
        initial={enquiries}
        types={types}
        staff={team.filter((s) => s.status === "active").map((s) => ({ id: s.id, email: s.email }))}
        canEdit={can(staff.staffRole, "enquiries.edit")}
        canDelete={can(staff.staffRole, "enquiries.delete")}
        canExport={can(staff.staffRole, "enquiries.export")}
      />
    </div>
  );
}
