import { createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { findApiKeyByHash, touchApiKey, getMerchantProfileById } from "@/lib/repo";
import { merchantBlockReason } from "@/lib/guards";

/**
 * API key auth for the public merchant API (/api/v1/*).
 *
 * Keys are shown once at creation and stored only as a SHA-256 hash, so a
 * database leak doesn't hand over working credentials.
 */

export function generateApiKey() {
  const raw = `sk_live_${randomBytes(24).toString("hex")}`;
  return { raw, prefix: raw.slice(0, 12), hash: hashKey(raw) };
}

export function hashKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export interface ApiCaller {
  merchantId: string;
  keyId: string;
}

/** Reads `Authorization: Bearer sk_live_...` and resolves the merchant. */
export async function authenticateApiRequest(req: NextRequest): Promise<ApiCaller | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;

  const record = await findApiKeyByHash(hashKey(token));
  if (!record) return null;

  // Same gate as the portal: a suspended, deleted or unverified merchant's
  // keys stop working immediately, not just their browser session.
  const merchant = await getMerchantProfileById(record.merchant_id);
  if (await merchantBlockReason(merchant as any) || (merchant as any)?.deletedAt) return null;

  await touchApiKey(record.id);
  return { merchantId: record.merchant_id, keyId: record.id };
}
