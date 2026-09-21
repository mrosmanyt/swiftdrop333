import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listAllZones, listAllChallenges, listPayoutRequests, listOpenBatches } from "@/lib/repo";
import OperationsPanel from "@/components/OperationsPanel";

export default async function AdminOperationsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <OperationsPanel
      zones={listAllZones() as any}
      challenges={listAllChallenges()}
      payouts={listPayoutRequests()}
      openBatches={listOpenBatches().length}
    />
  );
}
