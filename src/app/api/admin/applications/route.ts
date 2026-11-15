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

  const merchants = await Promise.all((await listMerchantsByKyb("pending")).map(async (m) => ({
    ...m,
    documents: await listDocuments("merchant", m!.id),
  })));

  const couriers = await Promise.all((await listCouriersByApproval("pending")).map(async (c) => ({
    ...c,
    documents: await listDocuments("courier", c!.id),
  })));

  return NextResponse.json({ merchants, couriers });
}
