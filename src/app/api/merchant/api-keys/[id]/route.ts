import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { webhookUrlProblem } from "@/lib/netGuard";
import { getMerchantProfileByUserId, revokeApiKey, setWebhookUrl } from "@/lib/repo";

const schema = z.object({
  webhookUrl: z
    .string()
    .url()
    .refine((u) => !webhookUrlProblem(u), { message: "Webhook URL must be a public https:// address" })
    .nullable()
    .optional(),
});

// PATCH /api/merchant/api-keys/:id — set or clear the webhook URL.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("MERCHANT");
  if (auth instanceof NextResponse) return auth;

  const merchant = await getMerchantProfileByUserId(auth.id);
  if (!merchant) return NextResponse.json({ error: "No merchant profile" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await setWebhookUrl(params.id, merchant.id, parsed.data.webhookUrl ?? null);
  return NextResponse.json({ ok: true });
}

// DELETE /api/merchant/api-keys/:id — revoke a key.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("MERCHANT");
  if (auth instanceof NextResponse) return auth;

  const merchant = await getMerchantProfileByUserId(auth.id);
  if (!merchant) return NextResponse.json({ error: "No merchant profile" }, { status: 404 });

  const ok = await revokeApiKey(params.id, merchant.id);
  if (!ok) return NextResponse.json({ error: "Key not found or already revoked" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
