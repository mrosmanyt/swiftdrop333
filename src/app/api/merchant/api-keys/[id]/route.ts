import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { getMerchantProfileByUserId, revokeApiKey, setWebhookUrl } from "@/lib/repo";

const schema = z.object({ webhookUrl: z.string().url().nullable().optional() });

// PATCH /api/merchant/api-keys/:id — set or clear the webhook URL.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("MERCHANT");
  if (auth instanceof NextResponse) return auth;

  const merchant = getMerchantProfileByUserId(auth.id);
  if (!merchant) return NextResponse.json({ error: "No merchant profile" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  setWebhookUrl(params.id, merchant.id, parsed.data.webhookUrl ?? null);
  return NextResponse.json({ ok: true });
}

// DELETE /api/merchant/api-keys/:id — revoke a key.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("MERCHANT");
  if (auth instanceof NextResponse) return auth;

  const merchant = getMerchantProfileByUserId(auth.id);
  if (!merchant) return NextResponse.json({ error: "No merchant profile" }, { status: 404 });

  const ok = revokeApiKey(params.id, merchant.id);
  if (!ok) return NextResponse.json({ error: "Key not found or already revoked" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
