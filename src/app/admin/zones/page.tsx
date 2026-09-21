import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listAllZones } from "@/lib/repo";
import NewZoneForm from "@/components/NewZoneForm";

export default async function AdminZonesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const zones = listAllZones();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zones & Pricing</h1>
        <NewZoneForm />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="p-3">City</th>
              <th className="p-3">Zone</th>
              <th className="p-3">Base rate</th>
              <th className="p-3">Per km</th>
              <th className="p-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z!.id} className="border-t border-gray-100">
                <td className="p-3">{z!.city}</td>
                <td className="p-3">{z!.name}</td>
                <td className="p-3">${(z!.baseRateCents / 100).toFixed(2)}</td>
                <td className="p-3">${(z!.perKmCents / 100).toFixed(2)}</td>
                <td className="p-3">{z!.isActive ? "Yes" : "No"}</td>
              </tr>
            ))}
            {!zones.length && (
              <tr>
                <td className="p-3 text-gray-400" colSpan={5}>
                  No zones yet — add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
