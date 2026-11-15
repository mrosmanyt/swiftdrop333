import { NextRequest, NextResponse } from "next/server";
import { adminJson, requireStaff } from "@/lib/cms/staff";
import { listEnquiries } from "@/lib/cms/enquiries";

export const dynamic = "force-dynamic";

// GET /api/admin/cms/enquiries?status=&type=&from=&to=&q=
export async function GET(req: NextRequest) {
  const staff = await requireStaff("enquiries.view");
  if (staff instanceof NextResponse) return staff;
  const p = req.nextUrl.searchParams;
  const enquiries = await listEnquiries({
    status: p.get("status") ?? undefined,
    type: p.get("type") ?? undefined,
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
    q: (p.get("q") ?? "").slice(0, 100) || undefined,
  });
  return adminJson({ enquiries });
}
