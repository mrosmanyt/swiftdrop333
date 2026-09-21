import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getCourierProfileByUserId } from "@/lib/repo";
import SafetySettings from "@/components/SafetySettings";

export default async function DriverSafetyPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "COURIER") redirect("/login");

  const courier = getCourierProfileByUserId(user.id);
  if (!courier) return <p>No courier profile found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Safety</h1>
        <p className="text-sm text-fg-muted">
          An SOS press notifies every admin instantly with your location. Keep an emergency contact on
          file so we know who to loop in.
        </p>
      </div>

      <SafetySettings
        initialName={courier.emergencyContactName ?? ""}
        initialPhone={courier.emergencyContactPhone ?? ""}
      />
    </div>
  );
}
