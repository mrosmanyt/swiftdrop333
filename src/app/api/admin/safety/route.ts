import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { listOpenSafetyIncidents } from "@/lib/repo";

/** GET /api/admin/safety — every open/acknowledged SOS incident, newest first. */
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ incidents: listOpenSafetyIncidents() });
}
