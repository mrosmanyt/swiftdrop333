import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listTickets, ticketCounts, listDisputes } from "@/lib/repo";
import { listFraudFlags } from "@/lib/fraud";
import SupportCentre from "@/components/SupportCentre";

export default async function AdminSupportPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <SupportCentre
      tickets={listTickets()}
      counts={ticketCounts()}
      disputes={listDisputes()}
      fraudFlags={listFraudFlags("open")}
    />
  );
}
