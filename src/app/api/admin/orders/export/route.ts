import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { listAllOrders } from "@/lib/repo";
import { toCsv, csvResponse } from "@/lib/csv";
import { ORDER_STATUS_LABEL, OrderStatus } from "@/lib/types";

// GET /api/admin/orders/export — downloads the current (non-deleted) orders
// list as a CSV, for the "Download CSV" button on /admin/orders.
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const orders = listAllOrders(1000);
  const csv = toCsv(
    orders.map((o) => ({
      id: o!.id,
      merchant: o!.merchantBusinessName ?? "",
      customer: o!.customerName,
      status: ORDER_STATUS_LABEL[o!.status as OrderStatus] ?? o!.status,
      courier: o!.courierEmail ?? "",
      priceCents: (o!.priceCents / 100).toFixed(2),
      createdAt: o!.createdAt,
      deliveredAt: o!.deliveredAt ?? "",
    })),
    [
      { key: "id", label: "Order ID" },
      { key: "merchant", label: "Merchant" },
      { key: "customer", label: "Customer" },
      { key: "status", label: "Status" },
      { key: "courier", label: "Courier" },
      { key: "priceCents", label: "Price ($)" },
      { key: "createdAt", label: "Created at" },
      { key: "deliveredAt", label: "Delivered at" },
    ]
  );
  return csvResponse(csv, "orders");
}
