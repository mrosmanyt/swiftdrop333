import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { listNotifications } from "@/lib/repo";

// GET /api/admin/notifications — every SMS/email the system generated,
// sent or logged. Doubles as the "did the customer get their link?" audit.
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ notifications: listNotifications(200) });
}
