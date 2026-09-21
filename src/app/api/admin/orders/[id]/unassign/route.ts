import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { adminUnassignOrder } from "@/lib/repo";
import { runDispatchTick } from "@/lib/dispatch";

// POST /api/admin/orders/:id/unassign — pull a stuck order back from a
// courier and put it straight back into the dispatch queue.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const ok = adminUnassignOrder(params.id, auth.id);
  if (!ok) return NextResponse.json({ error: "Order isn't currently assigned" }, { status: 409 });

  runDispatchTick();
  return NextResponse.json({ ok: true });
}
