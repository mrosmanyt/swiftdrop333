import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { assignBatchToCourier, getCourierProfileByUserId } from "@/lib/repo";
import { courierBlockReason } from "@/lib/guards";

// POST /api/batches/:id/accept — courier takes a whole optimized route.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const courier = await getCourierProfileByUserId(auth.id);
  const blocked = await courierBlockReason(courier);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 403 });

  const ok = await assignBatchToCourier(params.id, courier!.id);
  if (!ok) {
    return NextResponse.json({ error: "This route was already taken." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
