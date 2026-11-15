import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listMerchantsByKyb, listCouriersByApproval, listDocuments } from "@/lib/repo";
import ApplicationReview from "@/components/ApplicationReview";
import AutoRefresh from "@/components/AutoRefresh";

export default async function AdminApplicationsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const merchants = await listMerchantsByKyb("pending");
  const couriers = await listCouriersByApproval("pending");

  return (
    <div className="space-y-8">
      <AutoRefresh intervalMs={15000} />
      <div>
        <h1 className="text-2xl font-bold">Applications</h1>
        <p className="text-sm text-fg-muted">
          {merchants.length + couriers.length} waiting for review.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Businesses ({merchants.length})</h2>
        {await Promise.all(merchants.map(async (m) => (
          <ApplicationReview
            key={m!.id}
            kind="merchant"
            id={m!.id}
            title={m!.businessName}
            subtitle={m!.email}
            details={[
              { label: "Contact", value: m!.contactName ?? "—" },
              { label: "Phone", value: m!.businessPhone ?? "—" },
              { label: "City", value: m!.businessCity ?? "—" },
              { label: "Pickup address", value: m!.businessAddress ?? "—" },
              { label: "Business number", value: m!.businessNumber ?? "—" },
              { label: "Daily volume", value: m!.dailyVolume ? `${m!.dailyVolume} parcels/day` : "—" },
              { label: "Website", value: m!.website ?? "—" },
              { label: "Applied", value: new Date(m!.createdAt).toLocaleDateString() },
            ]}
            documents={await listDocuments("merchant", m!.id)}
          />
        )))}
        {!merchants.length && <p className="text-sm text-fg-subtle">No business applications waiting.</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Couriers ({couriers.length})</h2>
        {await Promise.all(couriers.map(async (c) => (
          <ApplicationReview
            key={c!.id}
            kind="courier"
            id={c!.id}
            title={c!.fullName ?? c!.email}
            subtitle={c!.email}
            details={[
              { label: "Phone", value: c!.phone ?? "—" },
              { label: "Vehicle", value: c!.vehicleType },
              { label: "Make/model", value: c!.vehicleMakeModel ?? "—" },
              { label: "Plate", value: c!.vehiclePlate ?? "—" },
              { label: "Licence # (last 4)", value: c!.licenseNumber ?? "—" },
              { label: "Licence expiry", value: c!.licenseExpiry ?? "—" },
              { label: "Insurer", value: c!.insuranceProvider ?? "—" },
              { label: "Policy # (last 4)", value: c!.insurancePolicyNumber ?? "—" },
              { label: "Background check", value: c!.backgroundCheckStatus },
              { label: "Applied", value: new Date(c!.createdAt).toLocaleDateString() },
            ]}
            documents={await listDocuments("courier", c!.id)}
          />
        )))}
        {!couriers.length && <p className="text-sm text-fg-subtle">No courier applications waiting.</p>}
      </section>
    </div>
  );
}
