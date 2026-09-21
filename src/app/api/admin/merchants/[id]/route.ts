import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { getMerchantProfileById, setMerchantKybStatus, setUserStatus } from "@/lib/repo";

const schema = z.object({
  kybStatus: z.enum(["pending", "verified", "rejected"]).optional(),
  userStatus: z.enum(["active", "suspended"]).optional(),
  notes: z.string().max(1000).optional(),
});

// PATCH /api/admin/merchants/:id — approve, reject, or suspend a merchant.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const merchant = getMerchantProfileById(params.id);
  if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

  if (parsed.data.kybStatus) {
    setMerchantKybStatus(merchant.id, parsed.data.kybStatus, auth.id, parsed.data.notes);
  }
  if (parsed.data.userStatus) {
    setUserStatus(merchant.userId, parsed.data.userStatus);
  }

  return NextResponse.json({ ok: true });
}
