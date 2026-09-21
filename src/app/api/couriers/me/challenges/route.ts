import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import {
  claimChallenge,
  courierDeliveriesBetween,
  getCourierProfileByUserId,
  hasClaimedChallenge,
  listActiveChallenges,
} from "@/lib/repo";

const TIER_RANK: Record<string, number> = { STARTER: 0, SILVER: 1, GOLD: 2, PRO: 3 };

/**
 * GET /api/couriers/me/challenges — live bonus campaigns with the
 * courier's real progress against each, so the target is visible while
 * there's still time to hit it (the retention point from the blueprint).
 */
export async function GET() {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 404 });

  const challenges = listActiveChallenges()
    .filter((c) => (TIER_RANK[courier.tier] ?? 0) >= (TIER_RANK[c.min_tier] ?? 0))
    .map((c) => {
      const progress = courierDeliveriesBetween(courier.id, c.starts_at, c.ends_at);
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        target: c.target_deliveries,
        bonusCents: c.bonus_cents,
        endsAt: c.ends_at,
        minTier: c.min_tier,
        progress,
        complete: progress >= c.target_deliveries,
        claimed: hasClaimedChallenge(c.id, courier.id),
      };
    });

  return NextResponse.json({ challenges });
}

const schema = z.object({ challengeId: z.string() });

// POST /api/couriers/me/challenges — claim a completed challenge's bonus.
export async function POST(req: NextRequest) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 404 });

  const challenge = listActiveChallenges().find((c) => c.id === parsed.data.challengeId);
  if (!challenge) return NextResponse.json({ error: "Challenge not found or ended" }, { status: 404 });

  const progress = courierDeliveriesBetween(courier.id, challenge.starts_at, challenge.ends_at);
  if (progress < challenge.target_deliveries) {
    return NextResponse.json(
      { error: `Not there yet — ${progress}/${challenge.target_deliveries} deliveries.` },
      { status: 400 }
    );
  }

  const ok = claimChallenge(challenge.id, courier.id, challenge.bonus_cents);
  if (!ok) return NextResponse.json({ error: "Already claimed" }, { status: 409 });

  return NextResponse.json({ ok: true, bonusCents: challenge.bonus_cents });
}
