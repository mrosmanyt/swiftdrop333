import { clientIp, hit } from "@/lib/rateLimit";
import { createAccount } from "@/lib/signup";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createCustomerUser, createCustomerAddress, findUserByEmail, writeAudit } from "@/lib/repo";

const PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
] as const;

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
  // Default delivery address, captured at signup so the customer's first
  // order flow is one field shorter. Optional — nothing breaks without it.
  address: z.string().min(3).optional(),
  city: z.string().min(2).optional(),
  province: z.enum(PROVINCES).optional(),
  postalCode: z
    .string()
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, "Enter a postal code like M5V 2T6")
    .optional(),
});

/**
 * POST /api/signup/customer — public self-signup for a customer account.
 * Unlike merchant/courier signup there's no review step: the account is
 * usable immediately. Past orders sent to this email/phone show up in
 * order history automatically (matched, not linked — see repo.ts), and a
 * referral code, if given, credits both sides right away.
 *
 * When a street address + city + postal code are provided, a default
 * address row is created in the same transaction as the account, so a
 * half-created sign-up can never leave an address pointing at no user.
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

  const wantsAddress = Boolean(input.address && input.city && input.postalCode);
  const address = wantsAddress
    ? `${input.address}, ${input.city}, ${input.province ?? ""} ${input.postalCode}`.replace(/\s+/g, " ").trim()
    : null;

  const passwordHash = await bcrypt.hash(input.password, 10);
  const userId = await createAccount("customer sign-up", async () => {
    const newUserId = await createCustomerUser({
      email,
      phone: input.phone,
      fullName: input.fullName,
      passwordHash,
      referralCode: input.referralCode,
    });

    if (address) {
      await createCustomerAddress(newUserId, {
        label: "Home",
        address,
        isDefault: true,
      });
    }

    await writeAudit(newUserId, "customer_signup", "user", newUserId, input.fullName);
    return newUserId;
  });
  if (userId instanceof NextResponse) return userId;

  return NextResponse.json({ ok: true, userId }, { status: 201 });
}
