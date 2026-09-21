import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { courierPayTransparency, getCourierProfileByUserId } from "@/lib/repo";

/**
 * GET /api/couriers/me/pay-statement — pay transparency.
 *
 * Ontario's Digital Platform Workers' Rights Act requires platforms to be
 * clear with couriers about how pay is calculated and how much time they
 * actually spent working. This returns engaged hours, earnings, bonuses
 * and the effective hourly rate for the period — the numbers a courier
 * needs to check they're being paid properly (and that you need on record).
 */
export async function GET() {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 404 });

  return NextResponse.json({
    period14: courierPayTransparency(courier.id, 14),
    period90: courierPayTransparency(courier.id, 90),
    payModel: {
      description:
        "You earn a per-delivery fee (base + distance, times the service-type and surge multipliers), plus your tier bonus per delivery, plus any challenge bonuses you complete.",
      platformTakeRatePercent: 28,
      tierBonusCents: { STARTER: 0, SILVER: 5, GOLD: 10, PRO: 20 },
      instantPayoutFeePercent: 1.5,
    },
  });
}
