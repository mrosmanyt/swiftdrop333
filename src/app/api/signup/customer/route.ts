import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createCustomerUser, findUserByEmail, writeAudit } from "@/lib/repo";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
});

/**
 * POST /api/signup/customer — public self-signup for a customer account.
 * Unlike merchant/courier signup there's no review step: the account is
 * usable immediately. Past orders sent to this email/phone show up in
 * order history automatically (matched, not linked — see repo.ts), and a
 * referral code, if given, credits both sides right away.
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
  const userId = createCustomerUser({
    email,
    phone: input.phone,
    fullName: input.fullName,
    passwordHash,
    referralCode: input.referralCode,
  });

  writeAudit(userId, "customer_signup", "user", userId, input.fullName);

  return NextResponse.json({ ok: true, userId }, { status: 201 });
}
