import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { supplyForecast, countOnlineCouriers } from "@/lib/repo";

/**
 * GET /api/admin/forecast — how many couriers each zone is likely to need
 * by hour, from historical demand. This is the planning input for
 * challenges and surge: if Friday 5pm downtown needs 12 couriers and you
 * usually get 6, that's where the bonus should go.
 */
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    forecast: supplyForecast(),
    onlineNow: countOnlineCouriers(),
  });
}
