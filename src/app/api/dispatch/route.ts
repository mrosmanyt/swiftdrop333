import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { runDispatchTick } from "@/lib/dispatch";

/**
 * POST /api/dispatch — run one pass of the dispatch loop.
 *
 * Called by the driver app and the admin dashboard while they poll, which
 * keeps dispatch moving without a separate worker process. In production
 * you'd also hit this from a cron job every ~10s so orders still get
 * dispatched when nobody has a tab open.
 *
 * Any signed-in user can trigger a tick (it only ever moves the queue
 * forward and can't leak data), but the result is only detailed for admins.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const result = runDispatchTick();
  if (user.role === "ADMIN") return NextResponse.json(result);
  return NextResponse.json({ ok: true });
}
