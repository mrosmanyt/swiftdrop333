import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import AccountSettings from "@/components/AccountSettings";
import { RETENTION } from "@/lib/retention";

export default async function AccountPage() {
  const user = await getSessionUser({ allowLimitedStaff: true });
  if (!user || user.role !== "ADMIN") redirect("/login");
  return <AccountSettings role="ADMIN" email={user.email} eraseAfterDays={RETENTION.erasureGraceDays} />;
}
