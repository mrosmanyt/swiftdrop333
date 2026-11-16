import { clientIp, hit } from "@/lib/rateLimit";
import { createAccount } from "@/lib/signup";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createUser, createMerchantProfile, findUserByEmail, writeAudit } from "@/lib/repo";
import { POSTAL_CODE_PATTERN, PROVINCE_CODES, formatPostalCode } from "@/lib/site/canada";

const VOLUMES = ["1-10", "11-50", "51-200", "200+"] as const;

const PATTERNS = ["on-demand", "scheduled", "mixed"] as const;

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
  // Structured pickup address. SwiftDrop only operates in Canada, so the
  // country is not asked for — province and postal code are validated instead.
  businessUnit: z.string().trim().max(40).optional(),
  businessProvince: z.enum(PROVINCE_CODES, { errorMap: () => ({ message: "Choose a province" }) }),
  businessPostalCode: z.string().trim().regex(POSTAL_CODE_PATTERN, "Enter a Canadian postal code, e.g. K1Z 7H1"),
  businessLat: z.number().min(41).max(84).nullable().optional(),
  businessLng: z.number().min(-142).max(-52).nullable().optional(),
  industry: z.string().trim().min(2, "Choose your industry").max(60),
  referralSource: z.string().trim().max(60).optional(),
  deliveryPattern: z.enum(PATTERNS, { errorMap: () => ({ message: "Choose how your deliveries go out" }) }),
  signupNotes: z.string().trim().max(1000).optional(),
  // Must be ticked. The moment of acceptance is recorded with the profile.
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Please read and accept the Terms of Service" }) }),
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
      businessUnit: input.businessUnit || undefined,
      businessProvince: input.businessProvince,
      businessPostalCode: formatPostalCode(input.businessPostalCode),
      businessLat: input.businessLat ?? null,
      businessLng: input.businessLng ?? null,
      industry: input.industry,
      referralSource: input.referralSource || undefined,
      deliveryPattern: input.deliveryPattern,
      signupNotes: input.signupNotes || undefined,
      termsAcceptedAt: new Date().toISOString(),
    });

    await writeAudit(userId, "merchant_signup", "merchant", newMerchantId, input.businessName);
    return newMerchantId;
  });
  if (merchantId instanceof NextResponse) return merchantId;

  return NextResponse.json({ ok: true, merchantId }, { status: 201 });
}
