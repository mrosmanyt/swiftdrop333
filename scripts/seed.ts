/**
 * Seed script — creates one merchant, one courier, one admin, and a couple
 * of pricing zones so you have real, working test accounts immediately.
 *
 * Run with: npm run seed   (or npm run db:reset to wipe and reseed)
 */
import bcrypt from "bcryptjs";
import {
  createUser,
  createMerchantProfile,
  createCourierProfile,
  createAdminProfile,
  createZone,
  findUserByEmail,
} from "../src/lib/repo";
import { seedDemoHistory, seedDemoMerchantTools } from "./demo-history";

async function main() {
  if (findUserByEmail("merchant@example.com")) {
    console.log("Already seeded — run `npm run db:reset` to wipe and reseed.");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const downtownZoneId = createZone({
    city: "Toronto",
    name: "Downtown Core",
    baseRateCents: 899,
    perKmCents: 50,
  });
  createZone({
    city: "Toronto",
    name: "North York",
    baseRateCents: 999,
    perKmCents: 60,
  });
  createZone({
    city: "Vancouver",
    name: "Downtown Vancouver",
    baseRateCents: 949,
    perKmCents: 55,
  });

  const merchantUserId = createUser({
    email: "merchant@example.com",
    fullName: "Sara Ahmed",
    phone: "4165550101",
    passwordHash,
    role: "MERCHANT",
  });
  const merchantId = createMerchantProfile({
    userId: merchantUserId,
    businessName: "Corner Bakery Co.",
    contactName: "Sara Ahmed",
    businessPhone: "4165550101",
    businessAddress: "123 Queen St W, Toronto, ON",
    kybStatus: "verified", // pre-approved so you can test deliveries immediately
  });

  const courierUserId = createUser({
    email: "courier@example.com",
    fullName: "Bilal Khan",
    phone: "4165550102",
    passwordHash,
    role: "COURIER",
  });
  const courierId = createCourierProfile({
    userId: courierUserId,
    vehicleType: "BIKE",
    fullName: "Bilal Khan",
    phone: "4165550102",
    backgroundCheckStatus: "passed",
    approvalStatus: "approved", // pre-approved
  });

  // Two applications left pending so the admin approval queue has something
  // real to review at /admin/applications.
  const pendingMerchantUserId = createUser({
    email: "pending-merchant@example.com",
    fullName: "Omar Farooq",
    passwordHash,
    role: "MERCHANT",
  });
  createMerchantProfile({
    userId: pendingMerchantUserId,
    businessName: "Bloom & Petal Florist",
    contactName: "Omar Farooq",
    businessPhone: "4165550199",
    businessAddress: "88 Dundas St E, Toronto, ON",
    businessNumber: "123456789RC0001",
    kybStatus: "pending",
  });

  const pendingCourierUserId = createUser({
    email: "pending-courier@example.com",
    fullName: "Maria Santos",
    passwordHash,
    role: "COURIER",
  });
  createCourierProfile({
    userId: pendingCourierUserId,
    vehicleType: "CAR",
    fullName: "Maria Santos",
    phone: "4165550188",
    vehicleMakeModel: "Toyota Corolla 2019",
    vehiclePlate: "CBXK 209",
    licenseNumber: "S1234-56789-01234",
    insuranceProvider: "Intact Insurance",
    insurancePolicyNumber: "POL-99281",
    approvalStatus: "pending",
  });

  const adminUserId = createUser({
    email: "admin@example.com",
    passwordHash,
    role: "ADMIN",
  });
  createAdminProfile({
    userId: adminUserId,
    permissions: ["manage_merchants", "manage_couriers", "manage_pricing"],
  });

  seedDemoHistory();
  seedDemoMerchantTools();

  console.log("Seeded successfully. Test accounts (password for all: password123):");
  console.log("  merchant@example.com          — approved, can book deliveries");
  console.log("  courier@example.com           — approved, can go online");
  console.log("  admin@example.com             — admin panel");
  console.log("  pending-merchant@example.com  — waiting in the approval queue");
  console.log("  pending-courier@example.com   — waiting in the approval queue");
  console.log("Merchant id:", merchantId, "· Courier id:", courierId);
  console.log("Zones created — first zone id (Downtown Core):", downtownZoneId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
