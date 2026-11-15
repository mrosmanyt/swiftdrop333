import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/repo";
import { adminJson, requireStaff } from "@/lib/cms/staff";
import { invalidateSessions } from "@/lib/cms/staffRepo";

export const dynamic = "force-dynamic";

// POST /api/admin/cms/session — "Sign out everywhere" for the person asking.
// Every device (including this one) has to sign in again.
export async function POST(req: NextRequest) {
  const staff = await requireStaff("analytics.view", req);
  if (staff instanceof NextResponse) return staff;
  await invalidateSessions(staff.id);
  await writeAudit(staff.id, "staff_signed_out_everywhere", "user", staff.id, staff.email);
  return adminJson({ ok: true });
}
