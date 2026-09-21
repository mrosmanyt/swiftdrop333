import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { listCouriers } from "@/lib/repo";
import { toCsv, csvResponse } from "@/lib/csv";

// GET /api/admin/couriers/export — downloads the current (non-deleted)
// courier list as a CSV, for the "Download CSV" button on /admin/couriers.
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const couriers = listCouriers();
  const csv = toCsv(
    couriers.map((c) => ({
      id: c!.id,
      email: c!.email,
      vehicleType: c!.vehicleType,
      tier: c!.tier,
      rating: c!.rating,
      backgroundCheckStatus: c!.backgroundCheckStatus,
      orderCount: c!.orderCount,
      isOnline: c!.isOnline ? "online" : "offline",
    })),
    [
      { key: "id", label: "Courier ID" },
      { key: "email", label: "Email" },
      { key: "vehicleType", label: "Vehicle" },
      { key: "tier", label: "Tier" },
      { key: "rating", label: "Rating" },
      { key: "backgroundCheckStatus", label: "Background check" },
      { key: "orderCount", label: "Deliveries" },
      { key: "isOnline", label: "Status" },
    ]
  );
  return csvResponse(csv, "couriers");
}
