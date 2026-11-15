import { clientIp, hit } from "@/lib/rateLimit";
import { createAccount } from "@/lib/signup";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createUser,
  createCourierProfile,
  findUserByEmail,
  getLoyaltyAccountByReferralCode,
  writeAudit,
} from "@/lib/repo";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

/**
 * Motorised couriers (CAR/VAN) drive on public roads, so a valid driver's
 * licence and vehicle insurance are part of the application itself — the
 * admin reviewing it needs the details, not just the uploaded documents.
 * Scooters are motorised too but are treated like bikes here: many
 * jurisdictions don't require a full class-5 licence for a moped, so the
 * admin decides per application.
 */
const motorisedDetails = z.object({
  vehicleMakeModel: z.string().min(2),
  vehiclePlate: z.string().min(2),
  licenseNumber: z.string().min(2),
  licenseExpiry: isoDate,
  insuranceProvider: z.string().min(2),
  insurancePolicyNumber: z.string().min(2),
  insuranceExpiry: isoDate,
});

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    fullName: z.string().min(2),
    phone: z.string().min(7),
    vehicleType: z.enum(["BIKE", "SCOOTER", "CAR", "VAN"]),
    vehicleMakeModel: z.string().optional(),
    vehiclePlate: z.string().optional(),
    licenseNumber: z.string().optional(),
    licenseExpiry: z.string().optional(),
    insuranceProvider: z.string().optional(),
    insurancePolicyNumber: z.string().optional(),
    insuranceExpiry: z.string().optional(),
    referralCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.vehicleType === "CAR" || data.vehicleType === "VAN") {
      const details = motorisedDetails.shape;
      for (const [field, rule] of Object.entries(details)) {
        const value = (data as Record<string, string | undefined>)[field];
        const check = rule.safeParse(value);
        if (!check.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: "Required for car and van couriers",
          });
        }
      }
    }
  });

/**
 * POST /api/signup/courier — public courier application.
 * Creates the account in approval_status = 'pending'. The courier signs in,
 * uploads their licence + insurance documents (POST /api/upload/document),
 * and waits for an admin to approve them in /admin/applications. Until then
 * they can't go online or accept offers.
 *
 * Note: a bike courier doesn't need a driver's licence or vehicle insurance,
 * so those fields stay optional for BIKE/SCOOTER here and the admin decides
 * per application. For CAR/VAN they're required up front (see schema).
 *
 * A referral code from an existing courier or merchant (`?ref=` on the
 * signup link) is recorded on the courier's application notes trail via the
 * audit log — couriers don't have loyalty accounts, so there's nothing to
 * credit automatically; the referrer bonus is handled manually by ops.
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

  // Validate the referral code up front when one is given, so the applicant
  // isn't told "account created" only for the code to silently go nowhere.
  let referralCode: string | null = null;
  if (input.referralCode?.trim()) {
    const referrer = await getLoyaltyAccountByReferralCode(input.referralCode);
    if (!referrer) {
      return NextResponse.json(
        { error: { fieldErrors: { referralCode: ["No account matches this referral code."] } } },
        { status: 400 }
      );
    }
    referralCode = input.referralCode.trim();
  }

  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const courierId = await createAccount("courier sign-up", async () => {
    const userId = await createUser({
      email,
      phone: input.phone,
      fullName: input.fullName,
      passwordHash,
      role: "COURIER",
    });

    const newCourierId = await createCourierProfile({
      userId,
      vehicleType: input.vehicleType,
      fullName: input.fullName,
      phone: input.phone,
      vehicleMakeModel: input.vehicleMakeModel,
      vehiclePlate: input.vehiclePlate,
      licenseNumber: input.licenseNumber,
      licenseExpiry: input.licenseExpiry,
      insuranceProvider: input.insuranceProvider,
      insurancePolicyNumber: input.insurancePolicyNumber,
      insuranceExpiry: input.insuranceExpiry,
      backgroundCheckStatus: "pending",
      approvalStatus: "pending",
    });

    await writeAudit(
      userId,
      "courier_signup",
      "courier",
      newCourierId,
      referralCode ? `referral code: ${referralCode}` : input.fullName
    );
    return newCourierId;
  });
  if (courierId instanceof NextResponse) return courierId;

  return NextResponse.json({ ok: true, courierId }, { status: 201 });
}
