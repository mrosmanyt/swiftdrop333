import { PageHeader } from "@/components/portal/ui";
import BackupPanel from "@/components/cms/BackupPanel";
import { staffPage } from "@/lib/cms/staff";

export const dynamic = "force-dynamic";

export default async function BackupPage() {
  await staffPage("backup.manage");
  return (
    <div className="space-y-5">
      <PageHeader title="Backup & restore" subtitle="Keep a copy of your website content and enquiries, and put content back if something goes wrong." />
      <BackupPanel />
    </div>
  );
}
