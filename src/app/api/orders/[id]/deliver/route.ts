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
import { POD_URL_PATTERN, podFileExists } from "@/lib/storage";

// Only a photo that was actually uploaded through POST /api/upload is
// accepted — never an arbitrary URL (which would let a courier embed an
// external image, i.e. a tracking pixel, on the customer's page).
const schema = z.object({
  proofOfDeliveryUrl: z.string().regex(POD_URL_PATTERN, "Upload the delivery photo first"),
});

// POST /api/orders/:id/deliver — courier confirms delivery with a photo URL
// (upload the photo first via POST /api/upload, then call this with the URL).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = await getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });

  // An age-restricted delivery can't be completed without the ID check
  // being recorded first — this is the compliance gate, not a suggestion.
  const target = await getOrderById(params.id);
  if (target?.requiresAgeVerification && target.ageVerificationMethod !== "id_checked") {
    return NextResponse.json(
      { error: "This delivery is age-restricted — it can only be completed after a successful ID check. If the ID check failed, return the parcel." },
      { status: 409 }
    );
  }

  if (!(await podFileExists(parsed.data.proofOfDeliveryUrl))) {
    return NextResponse.json({ error: "Delivery photo not found — upload it again." }, { status: 400 });
  }

  const ok = await markOrderDelivered(params.id, courier.id, parsed.data.proofOfDeliveryUrl);
  if (!ok) return NextResponse.json({ error: "Order not found, not yours, or not picked up yet" }, { status: 409 });

  // Trust checks: reused proof photo, implausibly fast delivery.
  await checkDuplicateProof(params.id, courier.id, parsed.data.proofOfDeliveryUrl);
  await checkInstantDelivery(params.id, courier.id);

  const order = await getOrderById(params.id);
  if (order) {
    const merchant = await getMerchantProfileById(order.merchantId);
    const merchantUser = merchant ? await findUserById(merchant.userId) : null;
    await notifyDelivered(order as any, merchantUser?.email ?? null, merchantUser?.id ?? null);
  }

  return NextResponse.json({ ok: true });
}
