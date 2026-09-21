import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getCourierProfileByUserId, listDocuments } from "@/lib/repo";
import { courierBlockReason } from "@/lib/guards";
import DocumentUpload from "@/components/DocumentUpload";

export default async function DriverDocumentsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "COURIER") redirect("/login");

  const courier = getCourierProfileByUserId(user.id);
  if (!courier) return <p>No courier profile found.</p>;

  const docs = listDocuments("courier", courier.id);
  const byType = (t: string) => docs.find((d) => d.docType === t) ?? null;
  const blockReason = courierBlockReason(courier);
  const motorised = courier.vehicleType !== "BIKE";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your documents</h1>
        <p className="text-sm text-fg-muted">
          Upload these so an admin can approve your account. JPG, PNG or PDF, up to 10MB each.
        </p>
      </div>

      <StatusBanner status={courier.approvalStatus} notes={courier.approvalNotes} blockReason={blockReason} />

      <div className="space-y-3">
        {motorised && (
          <>
            <DocumentUpload
              docType="drivers_license"
              label="Driver's licence"
              hint="Front of your valid licence."
              existing={byType("drivers_license")}
            />
            <DocumentUpload
              docType="insurance"
              label="Vehicle insurance"
              hint="Must cover commercial/delivery use."
              existing={byType("insurance")}
            />
            <DocumentUpload
              docType="vehicle_registration"
              label="Vehicle registration"
              hint="Ownership or registration document."
              existing={byType("vehicle_registration")}
            />
          </>
        )}
        {!motorised && (
          <DocumentUpload
            docType="drivers_license"
            label="Photo ID"
            hint="Any government-issued photo ID — bike couriers don't need a driver's licence or vehicle insurance."
            existing={byType("drivers_license")}
          />
        )}
      </div>

      <div className="rounded-xl border border-line bg-surface p-4 text-sm">
        <p className="font-medium">Application details</p>
        <dl className="mt-2 space-y-1 text-fg-muted">
          <Row label="Name" value={courier.fullName ?? "—"} />
          <Row label="Phone" value={courier.phone ?? "—"} />
          <Row label="Vehicle" value={courier.vehicleType} />
          <Row label="Background check" value={courier.backgroundCheckStatus} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line/60 py-1">
      <dt>{label}</dt>
      <dd className="text-fg-muted">{value}</dd>
    </div>
  );
}

function StatusBanner({
  status,
  notes,
  blockReason,
}: {
  status: string;
  notes: string | null;
  blockReason: string | null;
}) {
  if (status === "approved") {
    return (
      <div className="rounded-xl border border-ok/30 bg-ok-soft p-4 text-sm text-ok">
        <p className="font-medium">You&apos;re approved ✓</p>
        <p className="mt-1">Head to Offers, go online, and start accepting deliveries.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm text-warn">
      <p className="font-medium">
        {status === "rejected" ? "Application rejected" : "Application under review"}
      </p>
      <p className="mt-1">{blockReason}</p>
      {notes && <p className="mt-1 italic">Admin note: {notes}</p>}
    </div>
  );
}
