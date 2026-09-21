import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import {
  markOrderDelivered,
  getCourierProfileByUserId,
  getOrderById,
  getMerchantProfileById,
  findUserById,
} from "@/lib/repo";
import { notifyDelivered } from "@/lib/notify";
import { checkDuplicateProof, checkInstantDelivery } from "@/lib/fraud";

const schema = z.object({ proofOfDeliveryUrl: z.string().min(1) });

// POST /api/orders/:id/deliver — courier confirms delivery with a photo URL
// (upload the photo first via POST /api/upload, then call this with the URL).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });

  // An age-restricted delivery can't be completed without the ID check
  // being recorded first — this is the compliance gate, not a suggestion.
  const target = getOrderById(params.id);
  if (target?.requiresAgeVerification && !target.ageVerifiedAt) {
    return NextResponse.json(
      { error: "This delivery is age-restricted — record the ID check before completing it." },
      { status: 409 }
    );
  }

  const ok = markOrderDelivered(params.id, courier.id, parsed.data.proofOfDeliveryUrl);
  if (!ok) return NextResponse.json({ error: "Order not found or not yours" }, { status: 404 });

  // Trust checks: reused proof photo, implausibly fast delivery.
  checkDuplicateProof(params.id, courier.id, parsed.data.proofOfDeliveryUrl);
  checkInstantDelivery(params.id, courier.id);

  const order = getOrderById(params.id);
  if (order) {
    const merchant = getMerchantProfileById(order.merchantId);
    const merchantUser = merchant ? findUserById(merchant.userId) : null;
    await notifyDelivered(order as any, merchantUser?.email ?? null, merchantUser?.id ?? null);
  }

  return NextResponse.json({ ok: true });
}
