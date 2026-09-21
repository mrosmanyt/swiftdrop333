import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createUser, createCourierProfile, findUserByEmail, writeAudit } from "@/lib/repo";

const schema = z.object({
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
});

/**
 * POST /api/signup/courier — public courier application.
 * Creates the account in approval_status = 'pending'. The courier signs in,
 * uploads their licence + insurance documents (POST /api/upload/document),
 * and waits for an admin to approve them in /admin/applications. Until then
 * they can't go online or accept offers.
 *
 * Note: a bike courier doesn't need a driver's licence or vehicle insurance,
 * so those fields stay optional here and the admin decides per application.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  if (findUserByEmail(input.email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const userId = createUser({
    email: input.email,
    phone: input.phone,
    fullName: input.fullName,
    passwordHash,
    role: "COURIER",
  });

  const courierId = createCourierProfile({
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

  writeAudit(userId, "courier_signup", "courier", courierId, input.fullName);

  return NextResponse.json({ ok: true, courierId }, { status: 201 });
}
