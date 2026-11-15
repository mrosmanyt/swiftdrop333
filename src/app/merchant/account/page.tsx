import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import AccountSettings from "@/components/AccountSettings";
import { RETENTION } from "@/lib/retention";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "MERCHANT") redirect("/login");
  return <AccountSettings role="MERCHANT" email={user.email} eraseAfterDays={RETENTION.erasureGraceDays} />;
}
