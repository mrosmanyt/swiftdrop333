import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import {
  courierEarningsSummary,
  createPayoutRequest,
  getCourierProfileByUserId,
  listPayoutRequests,
} from "@/lib/repo";

/**
 * Courier payouts — the ledger side.
 *
 * No payment provider is wired up yet (that's deliberately last), so a
 * request lands in the admin queue as 'requested' and an admin marks it
 * paid after transferring. Swapping in Stripe Connect later means filling
 * in one function, not redesigning this.
 */

const INSTANT_FEE_PERCENT = 1.5; // instant cash-out fee, weekly is free

export async function GET() {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 404 });

  return NextResponse.json({
    summary: courierEarningsSummary(courier.id),
    requests: listPayoutRequests(courier.id),
    instantFeePercent: INSTANT_FEE_PERCENT,
  });
}

const schema = z.object({
  amountCents: z.number().int().positive(),
  method: z.enum(["instant", "weekly"]),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 404 });

  const summary = courierEarningsSummary(courier.id);
  if (parsed.data.amountCents > summary.availableCents) {
    return NextResponse.json(
      { error: `You can cash out up to $${(summary.availableCents / 100).toFixed(2)}.` },
      { status: 400 }
    );
  }

  const feeCents =
    parsed.data.method === "instant"
      ? Math.round((parsed.data.amountCents * INSTANT_FEE_PERCENT) / 100)
      : 0;

  const requestId = createPayoutRequest({
    courierId: courier.id,
    amountCents: parsed.data.amountCents,
    feeCents,
    method: parsed.data.method,
  });

  return NextResponse.json({ requestId, feeCents }, { status: 201 });
}
