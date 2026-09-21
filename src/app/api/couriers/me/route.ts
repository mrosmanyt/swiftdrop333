import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import {
  getCourierProfileByUserId,
  setCourierOnline,
  computeCourierStats14d,
  listDocuments,
} from "@/lib/repo";
import { nextTierProgress } from "@/lib/pricing";
import { courierBlockReason } from "@/lib/guards";

// GET /api/couriers/me — the signed-in courier's profile, approval state,
// uploaded documents, and tier progress.
export async function GET() {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 404 });

  const stats = computeCourierStats14d(courier.id);
  const progress = nextTierProgress(stats);
  const documents = listDocuments("courier", courier.id);

  return NextResponse.json({
    courier,
    stats,
    progress,
    documents,
    blockReason: courierBlockReason(courier),
  });
}

const schema = z.object({ isOnline: z.boolean() });

// PATCH /api/couriers/me — go online/offline. Blocked until the courier's
// application has been approved by an admin.
export async function PATCH(req: NextRequest) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileByUserId(auth.id);

  // Going offline is always allowed; going online requires approval.
  if (parsed.data.isOnline) {
    const blocked = courierBlockReason(courier);
    if (blocked) return NextResponse.json({ error: blocked }, { status: 403 });
  }
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 404 });

  setCourierOnline(courier.id, parsed.data.isOnline);
  return NextResponse.json({ ok: true });
}
