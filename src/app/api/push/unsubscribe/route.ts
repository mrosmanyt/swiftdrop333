import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { removePushSubscription } from "@/lib/push";

const schema = z.object({ endpoint: z.string().min(1) });

// POST /api/push/unsubscribe — drop a subscription (user turned notifications
// off). No auth check needed: the endpoint URL itself is the credential, and
// deleting a row that isn't yours to delete isn't possible without knowing it.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  removePushSubscription(parsed.data.endpoint);
  return NextResponse.json({ ok: true });
}
