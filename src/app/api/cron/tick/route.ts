import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runDispatchTick } from "@/lib/dispatch";
import { generateDueRecurringOrders } from "@/lib/recurring";
import { maybeRunRetention } from "@/lib/retention";

/**
 * GET /api/cron/tick — the scheduled heartbeat.
 *
 * Dispatch otherwise only moves while a driver or admin has the app open
 * (their pages poll POST /api/dispatch). This endpoint lets a scheduler keep
 * it moving when nobody does, and is also what creates the day's recurring
 * orders and runs the privacy retention sweep.
 *
 * Vercel Cron calls it on the schedule in vercel.json and sends
 * `Authorization: Bearer <CRON_SECRET>` automatically once CRON_SECRET is
 * set in the project's environment variables. Any other scheduler can call
 * it the same way. Without CRON_SECRET the endpoint is closed.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const out: Record<string, unknown> = {};
  // Each job is independent: one failing must not stop the others.
  try {
    out.recurring = await generateDueRecurringOrders();
  } catch (e) {
    console.error("[cron] recurring failed", e);
    out.recurringError = true;
  }
  try {
    out.dispatch = await runDispatchTick();
  } catch (e) {
    console.error("[cron] dispatch failed", e);
    out.dispatchError = true;
  }
  // Awaited here (the dispatch tick only fires it in the background, which a
  // serverless function may cut off). Throttled to once an hour per instance.
  await maybeRunRetention();

  return NextResponse.json({ ok: true, ...out });
}
