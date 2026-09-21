import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { createChallenge, listAllChallenges } from "@/lib/repo";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ challenges: listAllChallenges() });
}

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  targetDeliveries: z.number().int().positive(),
  bonusCents: z.number().int().positive(),
  startsAt: z.string(),
  endsAt: z.string(),
  minTier: z.enum(["STARTER", "SILVER", "GOLD", "PRO"]).default("STARTER"),
});

// POST /api/admin/challenges — launch a bonus campaign
// ("15 deliveries this weekend = $30 extra").
export async function POST(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const challengeId = createChallenge(parsed.data);
  return NextResponse.json({ challengeId }, { status: 201 });
}
