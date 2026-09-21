import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { listMerchants } from "@/lib/repo";

// GET /api/merchants — Admin only.
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ merchants: listMerchants() });
}
