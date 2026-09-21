import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { financialSummary } from "@/lib/repo";
import { toCsv, csvResponse } from "@/lib/csv";

// GET /api/admin/finance/export — daily revenue/payout/refund breakdown as
// CSV, for reconciliation outside the app (accounting, spreadsheets).
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const summary = financialSummary(30);
  const csv = toCsv(
    summary.dailySeries.map((d: any) => ({
      date: d.date,
      orders: d.orders,
      grossCents: (d.grossCents / 100).toFixed(2),
      platformFeeCents: (d.platformCents / 100).toFixed(2),
      courierFeeCents: (d.courierCents / 100).toFixed(2),
    })),
    [
      { key: "date", label: "Date" },
      { key: "orders", label: "Delivered orders" },
      { key: "grossCents", label: "Gross revenue ($)" },
      { key: "platformFeeCents", label: "Platform fee ($)" },
      { key: "courierFeeCents", label: "Courier fee ($)" },
    ]
  );
  return csvResponse(csv, "finance");
}
