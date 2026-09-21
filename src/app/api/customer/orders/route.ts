import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { findUserById, listOrdersForCustomer } from "@/lib/repo";

/** GET /api/customer/orders — every past delivery matched to this account's email/phone. */
export async function GET() {
  const auth = await requireRole("CUSTOMER");
  if (auth instanceof NextResponse) return auth;

  const user = findUserById(auth.id);
  const orders = listOrdersForCustomer({ email: user?.email ?? auth.email, phone: user?.phone });
  return NextResponse.json({ orders });
}
