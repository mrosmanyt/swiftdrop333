import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import AdminLiveMap from "@/components/AdminLiveMap";

export default async function AdminLiveMapPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Live Ops Map</h1>
        <p className="text-sm text-gray-500">
          Every courier currently on an active delivery — position updates every ~5 seconds.
        </p>
      </div>
      <AdminLiveMap />
    </div>
  );
}
