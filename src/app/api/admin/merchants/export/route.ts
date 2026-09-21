import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { listMerchants } from "@/lib/repo";
import { toCsv, csvResponse } from "@/lib/csv";

// GET /api/admin/merchants/export — downloads the current (non-deleted)
// merchant list as a CSV, for the "Download CSV" button on /admin/merchants.
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const merchants = listMerchants();
  const csv = toCsv(
    merchants.map((m) => ({
      id: m!.id,
      businessName: m!.businessName,
      email: m!.email,
      kybStatus: m!.kybStatus,
      orderCount: m!.orderCount,
      rating: m!.rating ?? "",
    })),
    [
      { key: "id", label: "Merchant ID" },
      { key: "businessName", label: "Business" },
      { key: "email", label: "Email" },
      { key: "kybStatus", label: "KYB status" },
      { key: "orderCount", label: "Orders" },
      { key: "rating", label: "Courier rating" },
    ]
  );
  return csvResponse(csv, "merchants");
}
