import { clientIp, hit } from "@/lib/rateLimit";
import { createAccount } from "@/lib/signup";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createUser, createMerchantProfile, findUserByEmail, writeAudit } from "@/lib/repo";

const VOLUMES = ["1-10", "11-50", "51-200", "200+"] as const;

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().min(2),
  contactName: z.string().min(2),
  businessPhone: z.string().min(7),
  businessAddress: z.string().min(5),
  businessCity: z.string().min(2),
  businessNumber: z.string().optional(),
  dailyVolume: z.enum(VOLUMES).optional(),
  website: z
    .string()
    .url("Enter a full URL, e.g. https://example.com")
    .optional()
    .or(z.literal("")),
});

/**
 * POST /api/signup/merchant — public self-signup.
 * The account is created immediately but lands in kyb_status = 'pending';
 * the merchant can sign in and see their status, but can't book deliveries
 * until an admin verifies them in /admin/applications.
 *
 * businessCity and dailyVolume feed the admin review queue and capacity
 * planning (003-merchant-operations). dailyVolume is optional — a business
 * with no sense of its volume yet shouldn't be blocked from applying.
 */
export async function POST(req: NextRequest) {
  if (!hit(`signup:ip:${clientIp(req.headers)}`, 10, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many sign-up attempts — please try again later." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const email = input.email.trim().toLowerCase();
  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const merchantId = await createAccount("merchant sign-up", async () => {
    const userId = await createUser({
      email,
      phone: input.businessPhone,
      fullName: input.contactName,
      passwordHash,
      role: "MERCHANT",
    });

    const newMerchantId = await createMerchantProfile({
      userId,
      businessName: input.businessName,
      contactName: input.contactName,
      businessPhone: input.businessPhone,
      businessAddress: input.businessAddress,
      businessCity: input.businessCity,
      businessNumber: input.businessNumber,
      dailyVolume: input.dailyVolume,
      website: input.website || undefined,
      kybStatus: "pending",
    });

    await writeAudit(userId, "merchant_signup", "merchant", newMerchantId, input.businessName);
    return newMerchantId;
  });
  if (merchantId instanceof NextResponse) return merchantId;

  return NextResponse.json({ ok: true, merchantId }, { status: 201 });
}
