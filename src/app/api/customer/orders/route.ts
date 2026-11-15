import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { listOrdersForCustomer } from "@/lib/repo";

/** GET /api/customer/orders — deliveries this customer has linked by opening their tracking link while signed in. */
export async function GET() {
  const auth = await requireRole("CUSTOMER");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ orders: await listOrdersForCustomer(auth.id) });
}
