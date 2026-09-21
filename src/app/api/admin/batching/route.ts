import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { runBatchingPass } from "@/lib/batchService";

/**
 * POST /api/admin/batching — run a batching pass now: cluster nearby
 * pending drop-offs and optimize each route. Returns the km saved versus
 * delivering them in arrival order, which is the efficiency number worth
 * watching.
 */
export async function POST() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(runBatchingPass());
}
