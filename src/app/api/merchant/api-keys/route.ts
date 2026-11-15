import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { webhookUrlProblem } from "@/lib/netGuard";
import { createApiKey, getMerchantProfileByUserId, listApiKeys } from "@/lib/repo";
import { generateApiKey } from "@/lib/apiAuth";
import { merchantBlockReason } from "@/lib/guards";

// GET /api/merchant/api-keys — list keys (prefix only, never the secret).
export async function GET() {
  const auth = await requireRole("MERCHANT");
  if (auth instanceof NextResponse) return auth;

  const merchant = await getMerchantProfileByUserId(auth.id);
  if (!merchant) return NextResponse.json({ error: "No merchant profile" }, { status: 404 });
  return NextResponse.json({ keys: await listApiKeys(merchant.id) });
}

const schema = z.object({
  name: z.string().min(1).max(60),
  webhookUrl: z
    .string()
    .url()
    .refine((u) => !webhookUrlProblem(u), { message: "Webhook URL must be a public https:// address" })
    .optional()
    .or(z.literal("")),
});

/**
 * POST /api/merchant/api-keys — mint a new key. The raw key is returned
 * exactly once here and never stored in plaintext.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole("MERCHANT");
  if (auth instanceof NextResponse) return auth;

  const merchant = await getMerchantProfileByUserId(auth.id);
  const blocked = await merchantBlockReason(merchant);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { raw, prefix, hash } = generateApiKey();
  const keyId = await createApiKey({
    merchantId: merchant!.id,
    name: parsed.data.name,
    keyPrefix: prefix,
    keyHash: hash,
    webhookUrl: parsed.data.webhookUrl || null,
  });

  return NextResponse.json(
    { keyId, apiKey: raw, note: "Copy this now — it won't be shown again." },
    { status: 201 }
  );
}
