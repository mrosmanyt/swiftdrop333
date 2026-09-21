import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { listActiveOrdersWithCourierLocation } from "@/lib/repo";

// GET /api/admin/live-orders — every in-flight delivery with its courier's
// current lat/lng, for the admin live ops map (polled every few seconds).
export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ orders: listActiveOrdersWithCourierLocation() });
}
