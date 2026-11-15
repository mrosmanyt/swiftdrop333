import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getMerchantProfileById, restoreMerchant } from "@/lib/repo";

// POST /api/admin/merchants/:id/restore — brings a soft-deleted merchant
// back out of /admin/deleted-records into every normal list.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const merchant = await getMerchantProfileById(params.id);
  if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

  if (!await restoreMerchant(merchant.id, auth.id)) {
    return NextResponse.json({ error: "This account's personal data was already erased — it can't be restored." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
