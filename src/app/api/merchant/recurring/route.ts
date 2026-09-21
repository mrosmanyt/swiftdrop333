import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { createRecurringOrder, getMerchantProfileByUserId, listRecurringOrders } from "@/lib/repo";
import { merchantBlockReason } from "@/lib/guards";
import { generateDueRecurringOrders } from "@/lib/recurring";

// GET /api/merchant/recurring — the merchant's standing schedules.
export async function GET() {
  const auth = await requireRole("MERCHANT");
  if (auth instanceof NextResponse) return auth;

  const merchant = getMerchantProfileByUserId(auth.id);
  if (!merchant) return NextResponse.json({ error: "No merchant profile" }, { status: 404 });

  // Opening this page is a good moment to materialise anything due today.
  await generateDueRecurringOrders();

  return NextResponse.json({ schedules: listRecurringOrders(merchant.id) });
}

const schema = z.object({
  label: z.string().min(1),
  zoneId: z.string(),
  pickupAddress: z.string().min(3),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffAddress: z.string().min(3),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  deliveryInstructions: z.string().optional(),
  serviceType: z.enum(["NEXT_DAY", "SAME_DAY", "DIRECT", "BATCH"]).default("SAME_DAY"),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1),
  windowHourStart: z.number().min(0).max(23).optional(),
  windowHourEnd: z.number().min(0).max(23).optional(),
});

/**
 * POST /api/merchant/recurring — a standing delivery, e.g. a pharmacy
 * sending to the same address every Monday/Wednesday/Friday.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole("MERCHANT");
  if (auth instanceof NextResponse) return auth;

  const merchant = getMerchantProfileByUserId(auth.id);
  const blocked = merchantBlockReason(merchant);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const recurringId = createRecurringOrder({
    ...parsed.data,
    merchantId: merchant!.id,
    customerEmail: parsed.data.customerEmail || null,
    daysOfWeek: parsed.data.daysOfWeek.join(","),
  });

  return NextResponse.json({ recurringId }, { status: 201 });
}
