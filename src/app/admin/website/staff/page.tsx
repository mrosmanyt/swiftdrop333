import { PageHeader } from "@/components/portal/ui";
import StaffManager from "@/components/cms/StaffManager";
import { staffPage } from "@/lib/cms/staff";
import { listStaff } from "@/lib/cms/staffRepo";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staff = await staffPage("staff.manage");
  return (
    <div className="space-y-5">
      <PageHeader title="Staff & roles" subtitle="Who can sign in to this admin console, and what each person is allowed to do." />
      <StaffManager initial={await listStaff()} me={staff.id} myRole={staff.staffRole} />
    </div>
  );
}
