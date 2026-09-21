import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { listCouriers } from "@/lib/repo";

// GET /api/couriers — Admin only: list couriers with tier/status.
export async function GET(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const onlineOnly = searchParams.get("online") === "true";
  return NextResponse.json({ couriers: listCouriers({ onlineOnly }) });
}
