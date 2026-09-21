import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getMerchantProfileByUserId, listDocuments } from "@/lib/repo";
import { merchantBlockReason } from "@/lib/guards";

// GET /api/merchants/me — the signed-in merchant's profile, KYB state and
// uploaded documents.
export async function GET() {
  const auth = await requireRole("MERCHANT");
  if (auth instanceof NextResponse) return auth;

  const merchant = getMerchantProfileByUserId(auth.id);
  if (!merchant) return NextResponse.json({ error: "No merchant profile" }, { status: 404 });

  return NextResponse.json({
    merchant,
    documents: listDocuments("merchant", merchant.id),
    blockReason: merchantBlockReason(merchant),
  });
}
