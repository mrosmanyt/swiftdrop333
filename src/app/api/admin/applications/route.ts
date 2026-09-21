import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { listMerchantsByKyb, listCouriersByApproval, listDocuments } from "@/lib/repo";

/**
 * GET /api/admin/applications — the approval queue: every merchant waiting
 * on KYB verification and every courier waiting on document approval, each
 * with their uploaded documents attached.
 */
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const merchants = listMerchantsByKyb("pending").map((m) => ({
    ...m,
    documents: listDocuments("merchant", m!.id),
  }));

  const couriers = listCouriersByApproval("pending").map((c) => ({
    ...c,
    documents: listDocuments("courier", c!.id),
  }));

  return NextResponse.json({ merchants, couriers });
}
