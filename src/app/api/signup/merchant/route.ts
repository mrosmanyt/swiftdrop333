import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createUser, createMerchantProfile, findUserByEmail, writeAudit } from "@/lib/repo";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().min(2),
  contactName: z.string().min(2),
  businessPhone: z.string().min(7),
  businessAddress: z.string().min(5),
  businessNumber: z.string().optional(),
  website: z.string().optional(),
});

/**
 * POST /api/signup/merchant — public self-signup.
 * The account is created immediately but lands in kyb_status = 'pending';
 * the merchant can sign in and see their status, but can't book deliveries
 * until an admin verifies them in /admin/applications.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const email = input.email.trim().toLowerCase();
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const userId = createUser({
    email,
    phone: input.businessPhone,
    fullName: input.contactName,
    passwordHash,
    role: "MERCHANT",
  });

  const merchantId = createMerchantProfile({
    userId,
    businessName: input.businessName,
    contactName: input.contactName,
    businessPhone: input.businessPhone,
    businessAddress: input.businessAddress,
    businessNumber: input.businessNumber,
    website: input.website,
    kybStatus: "pending",
  });

  writeAudit(userId, "merchant_signup", "merchant", merchantId, input.businessName);

  return NextResponse.json({ ok: true, merchantId }, { status: 201 });
}
